import { supabase, handleSupabaseError } from '@/lib/supabase';
import { imageCompressionService, CompressionResult } from './imageCompressionService';
import * as FileSystem from 'expo-file-system';

export interface LeaveAttachmentUploadOptions {
  compressionPreset?: 'high_quality' | 'balanced' | 'mobile_optimized' | 'thumbnail';
  customCompression?: {
    quality: number;
    maxWidth: number;
    maxHeight: number;
    targetSizeKB?: number;
  };
  generateThumbnail?: boolean;
  validateBeforeUpload?: boolean;
}

export interface LeaveAttachmentUploadResult {
  url: string | null;
  thumbnailUrl?: string | null;
  compressionStats?: CompressionResult;
  error: string | null;
  fileName?: string;
}

export interface AttachmentMetadata {
  originalFileName: string;
  fileSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  uploadedAt: Date;
  userId: string;
}

/**
 * Enhanced Leave Attachment Service with Automatic Image Compression
 * 
 * This service automatically compresses images before uploading to the leave-attachments bucket,
 * significantly reducing storage usage while maintaining acceptable quality.
 */
export class LeaveAttachmentService {
  private static instance: LeaveAttachmentService;

  public static getInstance(): LeaveAttachmentService {
    if (!LeaveAttachmentService.instance) {
      LeaveAttachmentService.instance = new LeaveAttachmentService();
    }
    return LeaveAttachmentService.instance;
  }

  /**
   * Upload leave attachment with automatic compression
   */
  async uploadLeaveAttachment(
    userId: string,
    fileUri: string,
    options: LeaveAttachmentUploadOptions = {}
  ): Promise<LeaveAttachmentUploadResult> {
    try {
      console.log('=== 📎 Starting Leave Attachment Upload with Compression ===');
      console.log('👤 User ID:', userId);
      console.log('📁 File URI:', fileUri);
      console.log('⚙️ Options:', options);

      // Step 1: Validate inputs
      if (!userId || !fileUri) {
        return {
          url: null,
          error: 'User ID and file URI are required',
        };
      }

      // Step 2: Validate file if requested
      if (options.validateBeforeUpload !== false) {
        const validation = await imageCompressionService.validateImageForCompression(fileUri);
        if (!validation.isValid) {
          return {
            url: null,
            error: validation.error || 'Invalid file',
          };
        }
      }

      // Step 3: Determine if file is an image
      const isImage = this.isImageFile(fileUri);
      let processedUri = fileUri;
      let compressionStats: CompressionResult | undefined;
      let thumbnailUrl: string | null = null;

      if (isImage) {
        console.log('🖼️ Processing image file...');

        // Get compression config
        const compressionConfig = options.customCompression || 
          imageCompressionService.getCompressionPreset(options.compressionPreset || 'balanced');

        // Compress main image
        compressionStats = await imageCompressionService.compressImage(
          fileUri,
          compressionConfig,
          'document' // Use document preset for leave attachments
        );

        if (compressionStats.error) {
          console.warn('⚠️ Compression failed, using original file:', compressionStats.error);
          processedUri = fileUri;
        } else {
          processedUri = compressionStats.uri;
          console.log(`✅ Image compressed: ${Math.round(compressionStats.compressionRatio * 100)}% size reduction`);
        }

        // Generate thumbnail if requested
        if (options.generateThumbnail) {
          thumbnailUrl = await this.generateThumbnail(userId, processedUri);
        }
      } else {
        console.log('📄 Processing non-image file (no compression needed)...');
      }

      // Step 4: Upload to Supabase Storage
      const uploadResult = await this.uploadToStorage(userId, processedUri, isImage);

      if (uploadResult.error) {
        return {
          url: null,
          error: uploadResult.error,
        };
      }

      // Step 5: Cleanup temporary files
      const tempFiles = [processedUri];
      if (processedUri !== fileUri) {
        tempFiles.push(processedUri);
      }
      await this.cleanupTempFiles(tempFiles.filter(uri => uri !== fileUri));

      console.log('=== ✅ Leave Attachment Upload Complete ===');

      return {
        url: uploadResult.url,
        thumbnailUrl,
        compressionStats,
        error: null,
        fileName: uploadResult.fileName,
      };
    } catch (error) {
      console.error('❌ Leave attachment upload failed:', error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple attachments with compression
   */
  async uploadMultipleAttachments(
    userId: string,
    fileUris: string[],
    options: LeaveAttachmentUploadOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<LeaveAttachmentUploadResult[]> {
    const results: LeaveAttachmentUploadResult[] = [];
    
    console.log(`📎 Starting batch upload of ${fileUris.length} attachments`);

    for (let i = 0; i < fileUris.length; i++) {
      const uri = fileUris[i];
      
      try {
        const result = await this.uploadLeaveAttachment(userId, uri, options);
        results.push(result);
        
        onProgress?.(i + 1, fileUris.length);
        
        if (result.error) {
          console.error(`❌ Failed to upload attachment ${i + 1}:`, result.error);
        } else {
          console.log(`✅ Uploaded attachment ${i + 1}/${fileUris.length}`);
        }
      } catch (error) {
        console.error(`❌ Error uploading attachment ${i + 1}:`, error);
        results.push({
          url: null,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return results;
  }

  /**
   * Generate thumbnail for image
   */
  private async generateThumbnail(userId: string, imageUri: string): Promise<string | null> {
    try {
      const thumbnailConfig = imageCompressionService.getCompressionPreset('thumbnail');
      const thumbnailResult = await imageCompressionService.compressImage(
        imageUri,
        thumbnailConfig,
        'photo'
      );

      if (thumbnailResult.error) {
        console.warn('Failed to generate thumbnail:', thumbnailResult.error);
        return null;
      }

      // Upload thumbnail
      const uploadResult = await this.uploadToStorage(
        userId, 
        thumbnailResult.uri, 
        true, 
        'thumbnail'
      );

      // Cleanup thumbnail temp file
      if (thumbnailResult.uri !== imageUri) {
        await this.cleanupTempFiles([thumbnailResult.uri]);
      }

      return uploadResult.url;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Upload processed file to Supabase Storage
   */
  private async uploadToStorage(
    userId: string,
    fileUri: string,
    isImage: boolean,
    type: 'attachment' | 'thumbnail' = 'attachment'
  ): Promise<{ url: string | null; error: string | null; fileName?: string }> {
    try {
      // Convert file to ArrayBuffer for Supabase upload
      const arrayBuffer = await this.uriToArrayBuffer(fileUri);
      
      if (arrayBuffer.byteLength === 0) {
        return { url: null, error: 'Processed file is empty' };
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = this.getFileExtension(fileUri);
      const prefix = type === 'thumbnail' ? 'thumb_' : '';
      const fileName = `${userId}/leave-requests/${prefix}attachment_${timestamp}${extension}`;

      console.log('📤 Uploading to storage:', {
        fileName,
        size: `${Math.round(arrayBuffer.byteLength / 1024)}KB`,
        type,
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('leave-attachments')
        .upload(fileName, arrayBuffer, {
          contentType: this.getContentType(extension),
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('❌ Storage upload failed:', error);
        return { url: null, error: handleSupabaseError(error) };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('leave-attachments')
        .getPublicUrl(data.path);

      console.log('✅ File uploaded successfully:', publicUrl);

      return { url: publicUrl, error: null, fileName: data.path };
    } catch (error) {
      console.error('❌ Storage upload error:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Convert URI to ArrayBuffer for Supabase upload
   */
  private async uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const response = await fetch(uri);
        return await response.arrayBuffer();
      }

      if (uri.startsWith('file://')) {
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

      throw new Error(`Unsupported URI format: ${uri}`);
    } catch (error) {
      console.error('Error converting URI to ArrayBuffer:', error);
      throw error;
    }
  }

  /**
   * Check if file is an image
   */
  private isImageFile(uri: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = this.getFileExtension(uri).toLowerCase();
    return imageExtensions.includes(extension);
  }

  /**
   * Get file extension from URI
   */
  private getFileExtension(uri: string): string {
    const parts = uri.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '.jpg';
  }

  /**
   * Get content type for file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    
    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(uris: string[]): Promise<void> {
    for (const uri of uris) {
      try {
        if (uri.startsWith('file://')) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (error) {
        console.warn('Failed to cleanup temp file:', uri);
      }
    }
  }

  /**
   * Get attachment metadata
   */
  async getAttachmentMetadata(attachmentUrl: string): Promise<AttachmentMetadata | null> {
    try {
      // Extract file path from URL
      const path = this.extractPathFromUrl(attachmentUrl);
      if (!path) return null;

      // Get file info from storage
      const { data, error } = await supabase.storage
        .from('leave-attachments')
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop(),
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      const fileInfo = data[0];
      
      return {
        originalFileName: fileInfo.name,
        fileSize: fileInfo.metadata?.size || 0,
        compressionRatio: 0, // Would need to be stored separately
        dimensions: { width: 0, height: 0 }, // Would need to be stored separately
        uploadedAt: new Date(fileInfo.created_at),
        userId: path.split('/')[0], // Extract user ID from path
      };
    } catch (error) {
      console.error('Error getting attachment metadata:', error);
      return null;
    }
  }

  /**
   * Delete attachment from storage
   */
  async deleteAttachment(attachmentUrl: string): Promise<{ error: string | null }> {
    try {
      const path = this.extractPathFromUrl(attachmentUrl);
      if (!path) {
        return { error: 'Invalid attachment URL' };
      }

      const { error } = await supabase.storage
        .from('leave-attachments')
        .remove([path]);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get storage usage statistics for user
   */
  async getUserStorageUsage(userId: string): Promise<{
    totalFiles: number;
    totalSizeKB: number;
    imageFiles: number;
    documentFiles: number;
    compressionSavingsKB: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from('leave-attachments')
        .list(`${userId}/leave-requests`, {
          limit: 1000,
        });

      if (error) {
        return {
          totalFiles: 0,
          totalSizeKB: 0,
          imageFiles: 0,
          documentFiles: 0,
          compressionSavingsKB: 0,
          error: handleSupabaseError(error),
        };
      }

      let totalSize = 0;
      let imageFiles = 0;
      let documentFiles = 0;

      for (const file of data) {
        const fileSize = file.metadata?.size || 0;
        totalSize += fileSize;

        if (this.isImageFile(file.name)) {
          imageFiles++;
        } else {
          documentFiles++;
        }
      }

      // Get compression stats (estimated)
      const compressionStats = imageCompressionService.getCompressionStats();
      const estimatedSavings = totalSize * 0.6; // Estimate 60% savings from compression

      return {
        totalFiles: data.length,
        totalSizeKB: Math.round(totalSize / 1024),
        imageFiles,
        documentFiles,
        compressionSavingsKB: Math.round(estimatedSavings / 1024),
        error: null,
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSizeKB: 0,
        imageFiles: 0,
        documentFiles: 0,
        compressionSavingsKB: 0,
        error: handleSupabaseError(error),
      };
    }
  }

  /**
   * Extract file path from storage URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/storage/v1/object/public/leave-attachments/');
      return urlParts.length > 1 ? urlParts[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if file is an image based on filename
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = fileName.toLowerCase().split('.').pop();
    return extension ? imageExtensions.includes(`.${extension}`) : false;
  }
}

// Convenience instance
export const leaveAttachmentService = LeaveAttachmentService.getInstance();