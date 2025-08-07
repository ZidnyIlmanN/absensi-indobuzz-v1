import { supabase, handleSupabaseError } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * SOLUSI UTAMA: Konversi URI ke ArrayBuffer untuk Supabase Storage React Native
 * Supabase Storage di React Native tidak mendukung Blob/File dengan baik,
 * sehingga kita perlu menggunakan ArrayBuffer dari data base64
 */
const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
  try {
    if (!uri || uri.trim() === '') {
      throw new Error('Invalid URI provided');
    }

    console.log('🔄 Converting URI to ArrayBuffer:', uri);

    // Method 1: Untuk HTTP/HTTPS URLs
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('🌐 Processing HTTP URL...');
      const response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('HTTP response returned empty data');
      }
      
      console.log('✅ ArrayBuffer created from HTTP URL:', {
        size: arrayBuffer.byteLength,
        type: 'ArrayBuffer'
      });

      return arrayBuffer;
    }

    // Method 2: Untuk file:// URIs - SOLUSI UTAMA
    if (uri.startsWith('file://')) {
      console.log('📁 Processing local file...');
      
      // Validasi file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📁 File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      if (fileInfo.size === 0) {
        throw new Error('File is empty');
      }

      // PERBAIKAN UTAMA: Baca file sebagai base64 lalu konversi ke ArrayBuffer
      console.log('🔄 Reading file as base64...');
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Data || base64Data.length === 0) {
        throw new Error('Failed to read file as base64');
      }

      console.log('📊 Base64 data length:', base64Data.length);

      // Konversi base64 ke ArrayBuffer
      console.log('🔄 Converting base64 to ArrayBuffer...');
      const binaryString = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('ArrayBuffer conversion resulted in empty data');
      }
      
      console.log('✅ ArrayBuffer created from file:', {
        originalSize: fileInfo.size,
        base64Length: base64Data.length,
        arrayBufferSize: arrayBuffer.byteLength,
        type: 'ArrayBuffer'
      });

      return arrayBuffer;
    }

    throw new Error(`Unsupported URI format: ${uri.substring(0, 50)}...`);
    
  } catch (error) {
    console.error('❌ Error converting URI to ArrayBuffer:', error);
    throw error instanceof Error ? error : new Error('Failed to convert URI to ArrayBuffer');
  }
};

export interface ImageUploadResult {
  url: string | null;
  error: string | null;
  fileName?: string;
}

export interface ImagePickerResult {
  uri: string | null;
  error: string | null;
  cancelled?: boolean;
}

export interface ImageCompressionOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png';
}

export class ImageService {
  private static instance: ImageService;
  
  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Request camera and media library permissions
   */
  async requestPermissions(): Promise<{ camera: boolean; mediaLibrary: boolean }> {
    try {
      const [cameraResult, mediaResult] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync(),
      ]);

      return {
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaResult.status === 'granted',
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  /**
   * Capture image from camera
   */
  async captureFromCamera(options?: {
    quality?: number;
    allowsEditing?: boolean;
    aspect?: [number, number];
  }): Promise<ImagePickerResult> {
    try {
      const permissions = await this.requestPermissions();
      
      if (!permissions.camera) {
        return {
          uri: null,
          error: 'Camera permission not granted',
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [1, 1],
        quality: options?.quality ?? 0.8,
        base64: false,
      });

      if (result.canceled) {
        return {
          uri: null,
          error: null,
          cancelled: true,
        };
      }

      if (result.assets && result.assets.length > 0) {
        return {
          uri: result.assets[0].uri,
          error: null,
        };
      }

      return {
        uri: null,
        error: 'No image captured',
      };
    } catch (error) {
      console.error('Camera capture error:', error);
      return {
        uri: null,
        error: error instanceof Error ? error.message : 'Camera capture failed',
      };
    }
  }

  /**
   * Select image from gallery
   */
  async selectFromGallery(options?: {
    quality?: number;
    allowsEditing?: boolean;
    aspect?: [number, number];
  }): Promise<ImagePickerResult> {
    try {
      const permissions = await this.requestPermissions();
      
      if (!permissions.mediaLibrary) {
        return {
          uri: null,
          error: 'Media library permission not granted',
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [1, 1],
        quality: options?.quality ?? 0.8,
        base64: false,
      });

      if (result.canceled) {
        return {
          uri: null,
          error: null,
          cancelled: true,
        };
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          error: null,
        };
      }

      return {
        uri: null,
        error: 'No image selected',
      };
    } catch (error) {
      console.error('Gallery selection error:', error);
      return {
        uri: null,
        error: error instanceof Error ? error.message : 'Gallery selection failed',
      };
    }
  }

  /**
   * PERBAIKAN: Improved image compression dengan validasi yang lebih baik
   */
  async compressImage(
    uri: string, 
    options: ImageCompressionOptions = { quality: 0.8 }
  ): Promise<{ uri: string | null; error: string | null }> {
    try {
      if (!uri || uri.trim() === '') {
        return {
          uri: null,
          error: 'Invalid image URI provided',
        };
      }

      console.log('🔄 Starting image compression:', uri);

      // Validasi source file untuk file:// URIs
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          return {
            uri: null,
            error: 'Source image file does not exist',
          };
        }
        
        if (fileInfo.size === 0) {
          return {
            uri: null,
            error: 'Source image file is empty',
          };
        }
        
        console.log('📁 Source file info:', fileInfo);
      }

      const manipulatorOptions: ImageManipulator.SaveOptions = {
        compress: options.quality,
        format: options.format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        base64: false,
      };
      
      const actions: ImageManipulator.Action[] = [];
      
      // Add resize action if dimensions specified
      if (options.maxWidth || options.maxHeight) {
        actions.push({
          resize: {
            width: options.maxWidth,
            height: options.maxHeight,
          },
        });
      }

      console.log('⚙️ Compression options:', { actions, options: manipulatorOptions });

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        manipulatorOptions
      );

      if (!result.uri) {
        return {
          uri: null,
          error: 'Image compression failed - no output URI',
        };
      }

      // Validasi compressed file
      const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('📁 Compressed file info:', compressedFileInfo);
      
      if (!compressedFileInfo.exists || compressedFileInfo.size === 0) {
        return {
          uri: null,
          error: 'Compressed image is empty or invalid',
        };
      }

      console.log('✅ Image compression successful:', {
        originalUri: uri,
        compressedUri: result.uri,
        compressedSize: compressedFileInfo.size,
        width: result.width,
        height: result.height
      });

      return {
        uri: result.uri,
        error: null,
      };
    } catch (error) {
      console.error('❌ Image compression error:', error);
      return {
        uri: null,
        error: error instanceof Error ? error.message : 'Image compression failed',
      };
    }
  }

  /**
   * SOLUSI UTAMA: Upload selfie menggunakan ArrayBuffer
   */
  async uploadSelfie(
    userId: string,
    imageUri: string,
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general',
    options?: ImageCompressionOptions
  ): Promise<ImageUploadResult> {
    try {
      console.log('=== 🚀 Starting Selfie Upload (ArrayBuffer Method) ===');
      console.log('👤 User ID:', userId);
      console.log('🖼️ Image URI:', imageUri);
      console.log('📝 Type:', type);

      // Step 1: Validasi input
      if (!userId || !imageUri) {
        return {
          url: null,
          error: 'User ID and image URI are required',
        };
      }

      // Step 2: Compress image
      const compressionResult = await this.compressImage(imageUri, {
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        format: 'jpeg',
        ...options,
      });

      if (compressionResult.error || !compressionResult.uri) {
        return {
          url: null,
          error: compressionResult.error || 'Image compression failed',
        };
      }

      // Step 3: SOLUSI UTAMA - Konversi ke ArrayBuffer
      const arrayBuffer = await uriToArrayBuffer(compressionResult.uri);
      
      if (arrayBuffer.byteLength === 0) {
        return {
          url: null,
          error: 'Processed image is empty',
        };
      }
      
      // Step 4: Generate filename dengan timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${userId}/selfies/${type}_${timestamp}.jpg`;
      
      console.log('📤 Uploading selfie with ArrayBuffer:', {
        fileName,
        arrayBufferSize: arrayBuffer.byteLength,
        type: 'ArrayBuffer'
      });

      // Step 5: Upload ke Supabase menggunakan ArrayBuffer
      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('❌ Selfie upload failed:', error);
        return { 
          url: null, 
          error: handleSupabaseError(error),
          fileName,
        };
      }

      // Step 6: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(data.path);

      console.log('✅ Selfie upload successful:', publicUrl);

      // Step 7: Verifikasi upload dengan mengecek file info
      const { data: uploadedFileInfo, error: fileInfoError } = await supabase.storage
        .from('selfies')
        .list(fileName.split('/').slice(0, -1).join('/'), {
          search: fileName.split('/').pop(),
        });

      if (!fileInfoError && uploadedFileInfo && uploadedFileInfo.length > 0) {
        const fileInfo = uploadedFileInfo[0];
        console.log('📊 Uploaded file verification:', {
          name: fileInfo.name,
          size: fileInfo.metadata?.size || 'unknown',
          lastModified: fileInfo.updated_at
        });

        if (fileInfo.metadata?.size === 0) {
          console.warn('⚠️ Warning: Uploaded file has 0 bytes size');
          return {
            url: null,
            error: 'Upload completed but file is empty. Please try again.',
          };
        }
      }

      return { 
        url: publicUrl, 
        error: null,
        fileName: data.path,
      };
    } catch (error) {
      console.error('❌ Selfie upload error:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * SOLUSI UTAMA: Upload profile photo menggunakan ArrayBuffer
   */
  async uploadProfilePhoto(
    userId: string,
    imageUri: string,
    options?: ImageCompressionOptions
  ): Promise<ImageUploadResult> {
    try {
      console.log('=== 🚀 Starting Profile Photo Upload (ArrayBuffer Method) ===');
      console.log('👤 User ID:', userId);
      console.log('🖼️ Original image URI:', imageUri);

      // Step 1: Validasi inputs
      if (!userId || !imageUri) {
        return {
          url: null,
          error: 'User ID and image URI are required',
        };
      }

      // Step 2: Validasi source file
      if (imageUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log('📁 Original file info:', fileInfo);
        
        if (!fileInfo.exists) {
          return {
            url: null,
            error: 'Original image file does not exist',
          };
        }
        
        if (fileInfo.size === 0) {
          return {
            url: null,
            error: 'Original image file is empty',
          };
        }

        // Check file size limit (5MB)
        if (fileInfo.size > 5 * 1024 * 1024) {
          return {
            url: null,
            error: 'Image file is too large (max 5MB)',
          };
        }
      }

      // Step 3: Compress image dengan optimal settings
      console.log('🔄 Starting image compression...');
      
      const compressionOptions = {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        format: 'jpeg' as const,
        ...options,
      };
      
      const compressionResult = await this.compressImage(imageUri, compressionOptions);

      if (compressionResult.error || !compressionResult.uri) {
        console.error('❌ Compression failed:', compressionResult.error);
        return {
          url: null,
          error: compressionResult.error || 'Image compression failed',
        };
      }

      console.log('✅ Compression successful:', compressionResult.uri);

      // Step 4: SOLUSI UTAMA - Konversi ke ArrayBuffer
      console.log('🔄 Converting to ArrayBuffer...');
      let arrayBuffer: ArrayBuffer;
      
      try {
        arrayBuffer = await uriToArrayBuffer(compressionResult.uri);
      } catch (arrayBufferError) {
        console.error('❌ ArrayBuffer conversion failed:', arrayBufferError);
        return {
          url: null,
          error: `Failed to process image: ${arrayBufferError instanceof Error ? arrayBufferError.message : 'Unknown error'}`,
        };
      }
      
      // Step 5: Validasi ArrayBuffer
      console.log('🔍 Validating ArrayBuffer:', {
        size: arrayBuffer.byteLength,
        type: 'ArrayBuffer',
        constructor: arrayBuffer.constructor.name
      });
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return {
          url: null,
          error: 'Processed image is empty',
        };
      }

      if (arrayBuffer.byteLength > 2 * 1024 * 1024) { // 2MB limit for avatars
        return {
          url: null,
          error: 'Compressed image is still too large (max 2MB for avatars)',
        };
      }
      
      // Step 6: Generate filename dengan timestamp
      const timestamp = Date.now();
      const fileName = `${userId}/profile/avatar_${timestamp}.jpg`;
      
      console.log('📤 Uploading to Supabase with ArrayBuffer:', {
        bucket: 'avatars',
        fileName,
        arrayBufferSize: arrayBuffer.byteLength
      });

      // Step 7: Upload menggunakan ArrayBuffer
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // Allow overwrite
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

      console.log('✅ Upload successful:', data);

      // Step 8: Verifikasi upload
      const { data: uploadedFileInfo, error: fileInfoError } = await supabase.storage
        .from('avatars')
        .list(fileName.split('/').slice(0, -1).join('/'), {
          search: fileName.split('/').pop(),
        });

      if (!fileInfoError && uploadedFileInfo && uploadedFileInfo.length > 0) {
        const fileInfo = uploadedFileInfo[0];
        console.log('📊 Uploaded file verification:', {
          name: fileInfo.name,
          size: fileInfo.metadata?.size || 'unknown',
          lastModified: fileInfo.updated_at
        });

        if (fileInfo.metadata?.size === 0) {
          console.error('❌ Critical: Uploaded file has 0 bytes!');
          return {
            url: null,
            error: 'Upload completed but file is empty. This indicates a Supabase Storage issue.',
          };
        }
      }

      // Step 9: Get public URL dengan cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      const cacheBustedUrl = `${publicUrl}?t=${timestamp}`;
      
      console.log('=== 🎉 Profile Photo Upload Complete ===');
      console.log('🔗 Final URL:', cacheBustedUrl);

      return { 
        url: cacheBustedUrl, 
        error: null,
        fileName: data.path,
      };
    } catch (error) {
      console.error('❌ Profile photo upload error:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Update user profile dengan avatar URL baru
   */
  async updateProfileAvatar(userId: string, avatarUrl: string): Promise<{ error: string | null }> {
    try {
      console.log('🔄 Updating profile avatar for user:', userId);
      console.log('🔗 New avatar URL:', avatarUrl);

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Profile update error:', error);
        return { error: handleSupabaseError(error) };
      }

      console.log('✅ Profile avatar updated successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Update profile avatar error:', error);
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Delete image from storage
   */
  async deleteImage(bucket: string, path: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get all selfies untuk user (untuk history/gallery view)
   */
  async getUserSelfies(userId: string): Promise<{ urls: string[]; error: string | null }> {
    try {
      console.log('🔄 Fetching selfies for user:', userId);
      
      const { data, error } = await supabase.storage
        .from('selfies')
        .list(`${userId}/selfies`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('❌ Failed to list selfies:', error);
        return { urls: [], error: handleSupabaseError(error) };
      }

      console.log('📸 Found selfie files:', data.length);

      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('selfies')
          .getPublicUrl(`${userId}/selfies/${file.name}`);
        return publicUrl;
      });

      console.log('🔗 Generated public URLs:', urls.length);
      return { urls, error: null };
    } catch (error) {
      console.error('❌ Error in getUserSelfies:', error);
      return { urls: [], error: handleSupabaseError(error) };
    }
  }

  /**
   * Subscribe to real-time selfie uploads for a user
   */
  subscribeToSelfieUploads(
    userId: string, 
    onNewSelfie: (selfieUrl: string, type: string) => void
  ): () => void {
    console.log('🔄 Setting up selfie upload subscription for user:', userId);
    
    // Listen for storage object insertions in user's selfie folder
    const channel = supabase
      .channel(`selfie-uploads-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'storage',
          table: 'objects',
          filter: `bucket_id=eq.selfies`,
        },
        (payload) => {
          const objectName = payload.new.name;
          
          // Check if this object belongs to the current user
          if (objectName.startsWith(`${userId}/selfies/`)) {
            console.log('📸 New selfie uploaded:', objectName);
            
            // Extract type from filename
            const fileName = objectName.split('/').pop() || '';
            const type = fileName.split('_')[0];
            
            // Generate public URL
            const { data: { publicUrl } } = supabase.storage
              .from('selfies')
              .getPublicUrl(objectName);
            
            onNewSelfie(publicUrl, type);
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      console.log('🔄 Cleaning up selfie upload subscription');
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get real-time selfie count for user
   */
  async getRealTimeSelfieCount(userId: string): Promise<{ count: number; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from('selfies')
        .list(`${userId}/selfies`, {
          limit: 1000, // Get all to count
        });

      if (error) {
        return { count: 0, error: handleSupabaseError(error) };
      }

      return { count: data.length, error: null };
    } catch (error) {
      return { count: 0, error: handleSupabaseError(error) };
    }
  }

  /**
   * SOLUSI UTAMA: Complete profile photo update workflow dengan ArrayBuffer
   */
  async updateProfilePhotoComplete(
    userId: string,
    imageUri: string
  ): Promise<{ avatarUrl: string | null; error: string | null }> {
    try {
      console.log('=== 🚀 Starting Complete Profile Photo Update (ArrayBuffer Method) ===');
      
      if (!userId || !imageUri) {
        return {
          avatarUrl: null,
          error: 'Missing required parameters',
        };
      }

      // Step 1: Upload image menggunakan ArrayBuffer method
      const uploadResult = await this.uploadProfilePhoto(userId, imageUri);
      
      if (uploadResult.error || !uploadResult.url) {
        return {
          avatarUrl: null,
          error: uploadResult.error || 'Upload failed',
        };
      }

      // Step 2: Update profile
      const updateResult = await this.updateProfileAvatar(userId, uploadResult.url);
      
      if (updateResult.error) {
        // Rollback: delete uploaded image jika profile update gagal
        if (uploadResult.fileName) {
          console.log('🔄 Rolling back upload due to profile update failure');
          await this.deleteImage('avatars', uploadResult.fileName);
        }
        
        return {
          avatarUrl: null,
          error: updateResult.error,
        };
      }

      console.log('=== 🎉 Profile Photo Update Complete ===');
      return {
        avatarUrl: uploadResult.url,
        error: null,
      };
    } catch (error) {
      console.error('❌ Profile photo update workflow error:', error);
      return {
        avatarUrl: null,
        error: error instanceof Error ? error.message : 'Profile photo update failed',
      };
    }
  }

  /**
   * Validasi image file sebelum processing
   */
  async validateImageFile(uri: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!uri) {
        return { isValid: false, error: 'No image URI provided' };
      }

      // Untuk file:// URIs, check file system
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        
        if (!fileInfo.exists) {
          return { isValid: false, error: 'Image file does not exist' };
        }
        
        if (fileInfo.size === 0) {
          return { isValid: false, error: 'Image file is empty' };
        }
        
        if (fileInfo.size > 10 * 1024 * 1024) { // 10MB limit
          return { isValid: false, error: 'Image file is too large (max 10MB)' };
        }
      }

      // Untuk HTTP URLs, try to fetch headers
      if (uri.startsWith('http')) {
        try {
          const response = await fetch(uri, { method: 'HEAD' });
          
          if (!response.ok) {
            return { isValid: false, error: 'Image URL is not accessible' };
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            return { isValid: false, error: 'URL does not point to an image' };
          }
        } catch (fetchError) {
          return { isValid: false, error: 'Unable to validate image URL' };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Image validation failed' 
      };
    }
  }

  /**
   * Debug function untuk troubleshooting upload issues
   */
  async debugUploadProcess(
    userId: string,
    imageUri: string,
    type: 'selfie' | 'avatar' = 'selfie'
  ): Promise<{
    steps: { [key: string]: any };
    finalResult: 'success' | 'failure';
    error?: string;
  }> {
    const debugSteps: { [key: string]: any } = {};
    
    try {
      // Step 1: Validate input
      debugSteps.input_validation = {
        userId: !!userId,
        imageUri: !!imageUri,
        uriFormat: imageUri.startsWith('file://') ? 'file' : imageUri.startsWith('http') ? 'http' : 'unknown'
      };

      // Step 2: Check file info
      if (imageUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        debugSteps.file_info = fileInfo;
      }

      // Step 3: Test compression
      const compressionResult = await this.compressImage(imageUri, { quality: 0.8 });
      debugSteps.compression = {
        success: !compressionResult.error,
        error: compressionResult.error,
        outputUri: compressionResult.uri
      };

      if (compressionResult.error) {
        return {
          steps: debugSteps,
          finalResult: 'failure',
          error: compressionResult.error
        };
      }

      // Step 4: Test ArrayBuffer conversion
      try {
        const arrayBuffer = await uriToArrayBuffer(compressionResult.uri!);
        debugSteps.array_buffer_conversion = {
          success: true,
          size: arrayBuffer.byteLength
        };
      } catch (arrayBufferError) {
        debugSteps.array_buffer_conversion = {
          success: false,
          error: arrayBufferError instanceof Error ? arrayBufferError.message : 'Unknown error'
        };
        
        return {
          steps: debugSteps,
          finalResult: 'failure',
          error: 'ArrayBuffer conversion failed'
        };
      }

      // Step 5: Test Supabase connection
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        debugSteps.supabase_connection = {
          success: !bucketsError,
          bucketsCount: buckets?.length || 0,
          error: bucketsError?.message
        };
      } catch (supabaseError) {
        debugSteps.supabase_connection = {
          success: false,
          error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
        };
      }

      return {
        steps: debugSteps,
        finalResult: 'success',
      };
    } catch (error) {
      return {
        steps: debugSteps,
        finalResult: 'failure',
        error: error instanceof Error ? error.message : 'Debug process failed'
      };
    }
  }

  /**
   * Get storage usage untuk debugging
   */
  async getStorageUsage(userId: string): Promise<{
    selfiesCount: number;
    avatarsCount: number;
    totalSize: number;
    error: string | null;
  }> {
    try {
      const [selfiesResult, avatarsResult] = await Promise.all([
        supabase.storage.from('selfies').list(`${userId}/selfies`),
        supabase.storage.from('avatars').list(`${userId}/profile`),
      ]);

      const selfiesCount = selfiesResult.data?.length || 0;
      const avatarsCount = avatarsResult.data?.length || 0;

      // Calculate total size
      const totalSize = [
        ...(selfiesResult.data || []),
        ...(avatarsResult.data || []),
      ].reduce((total, file) => total + (file.metadata?.size || 0), 0);

      return {
        selfiesCount,
        avatarsCount,
        totalSize,
        error: null,
      };
    } catch (error) {
      return {
        selfiesCount: 0,
        avatarsCount: 0,
        totalSize: 0,
        error: handleSupabaseError(error),
      };
    }
  }
}

// Convenience instance
export const imageService = ImageService.getInstance();