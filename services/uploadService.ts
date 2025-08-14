import { supabase, handleSupabaseError } from '@/lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * SOLUSI UTAMA: Konversi URI ke ArrayBuffer untuk Supabase Storage React Native
 */
const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
  try {
    if (!uri || uri.trim() === '') {
      throw new Error('Invalid URI provided');
    }

    console.log('🔄 Converting URI to ArrayBuffer:', uri);

    // Untuk file:// URIs
    if (uri.startsWith('file://')) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryString = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      return arrayBuffer;
    }

    // Untuk HTTP/HTTPS URLs
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('❌ Error converting URI to ArrayBuffer:', error);
    throw error;
  }
};

export interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
  maxFileSize?: number; // in MB
}

export interface UploadResult {
  url: string | null;
  error: string | null;
  fileName?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export class UploadService {
  private static instance: UploadService;

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Compress image dengan kompresi otomatis
   */
  async compressImage(
    uri: string,
    options: UploadOptions = {}
  ): Promise<{ uri: string; size: number; error: string | null }> {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        format = 'jpeg',
        maxFileSize = 2 // 2MB default
      } = options;

      // Validasi file size sebelum kompresi
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size > maxFileSize * 1024 * 1024) {
        console.log(`📊 File size: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB, compressing...`);
      }

      const manipulatorOptions: ImageManipulator.SaveOptions = {
        compress: quality,
        format: format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        base64: false,
      };

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        manipulatorOptions
      );

      // Dapatkan ukuran file yang sudah dikompresi
      const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);
      const compressedSize = compressedFileInfo.exists ? compressedFileInfo.size : 0;

      return {
        uri: result.uri,
        size: compressedSize,
        error: null,
      };
    } catch (error) {
      console.error('❌ Image compression error:', error);
      return {
        uri: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Compression failed',
      };
    }
  }

  /**
   * Upload image dengan kompresi otomatis
   */
  async uploadImage(
    userId: string,
    imageUri: string,
    bucket: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      console.log('=== 🚀 Starting Image Upload with Compression ===');
      console.log('👤 User ID:', userId);
      console.log('🖼️ Original Image URI:', imageUri);
      console.log('📁 Bucket:', bucket);

      // Step 1: Validasi input
      if (!userId || !imageUri || !bucket) {
        return {
          url: null,
          error: 'User ID, image URI, and bucket are required',
        };
      }

      // Step 2: Dapatkan ukuran file asli
      const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = originalFileInfo.exists ? originalFileInfo.size : 0;

      // Step 3: Compress image
      const compressionResult = await this.compressImage(imageUri, options);
      
      if (compressionResult.error) {
        return {
          url: null,
          error: compressionResult.error,
        };
      }

      // Step 4: Konversi ke ArrayBuffer
      const arrayBuffer = await uriToArrayBuffer(compressionResult.uri);

      // Step 5: Generate filename dengan timestamp
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;

      // Step 6: Upload ke Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });

      if (error) {
        console.error('❌ Upload failed:', error);
        return {
          url: null,
          error: handleSupabaseError(error),
          fileName,
        };
      }

      // Step 7: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      // Hitung compression ratio
      const compressionRatio = originalSize > 0 ? (originalSize - compressionResult.size) / originalSize : 0;

      console.log('✅ Upload successful:', {
        url: publicUrl,
        originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressionResult.size / 1024 / 1024).toFixed(2)}MB`,
        compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
      });

      return {
        url: publicUrl,
        error: null,
        fileName: data.path,
        originalSize,
        compressedSize: compressionResult.size,
        compressionRatio,
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload attachment untuk leave requests dengan kompresi
   */
  async uploadLeaveAttachment(
    userId: string,
    imageUri: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return this.uploadImage(userId, imageUri, 'leave-attachments', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      maxFileSize: 2, // 2MB max for attachments
      ...options,
    });
  }

  /**
   * Upload selfie dengan kompresi
   */
  async uploadSelfie(
    userId: string,
    imageUri: string,
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general',
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return this.uploadImage(userId, imageUri, 'selfies', {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
      maxFileSize: 1, // 1MB max for selfies
      ...options,
    });
  }

  /**
   * Upload avatar dengan kompresi
   */
  async uploadAvatar(
    userId: string,
    imageUri: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return this.uploadImage(userId, imageUri, 'avatars', {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
      maxFileSize: 1, // 1MB max for avatars
      ...options,
    });
  }

  /**
   * Get file info untuk debugging
   */
  async getFileInfo(uri: string): Promise<{ size: number; exists: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return {
        size: fileInfo.exists ? fileInfo.size : 0,
        exists: fileInfo.exists,
      };
    } catch (error) {
      return {
        size: 0,
        exists: false,
        error: error instanceof Error ? error.message : 'Failed to get file info',
      };
    }
  }

  /**
   * Format file size untuk display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const uploadService = UploadService.getInstance();
