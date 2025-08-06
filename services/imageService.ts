import { supabase, handleSupabaseError } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * PERBAIKAN UTAMA: Simplified and more reliable URI to Blob conversion
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    if (!uri || uri.trim() === '') {
      throw new Error('Invalid URI provided');
    }

    console.log('🔄 Converting URI to blob:', uri);

    // Method 1: For HTTP/HTTPS URLs (simple and reliable)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('🌐 Processing HTTP URL...');
      const response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('HTTP response returned empty blob');
      }
      
      console.log('✅ Blob created from HTTP URL:', {
        size: blob.size,
        type: blob.type
      });

      return blob;
    }

    // Method 2: For file:// URIs (improved and simplified)
    if (uri.startsWith('file://')) {
      console.log('📁 Processing local file...');
      
      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📁 File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      if (fileInfo.size === 0) {
        throw new Error('File is empty');
      }

      // PERBAIKAN: Use fetch directly with file URI (React Native supports this)
      try {
        console.log('🔄 Using direct fetch for file URI...');
        const response = await fetch(uri);
        
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.status}`);
        }

        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('File fetch returned empty blob');
        }
        
        console.log('✅ Blob created from file URI:', {
          size: blob.size,
          type: blob.type,
          originalSize: fileInfo.size
        });

        return blob;
      } catch (fetchError) {
        console.warn('⚠️ Direct fetch failed, trying base64 method:', fetchError);
        
        // Fallback: Base64 method (simplified)
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (!base64 || base64.length === 0) {
          throw new Error('Failed to read file as base64');
        }

        // Create blob from base64 (simplified approach)
        const mimeType = 'image/jpeg';
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        if (blob.size === 0) {
          throw new Error('Base64 conversion resulted in empty blob');
        }
        
        console.log('✅ Blob created from base64:', {
          size: blob.size,
          type: blob.type,
          base64Length: base64.length
        });

        return blob;
      }
    }

    throw new Error(`Unsupported URI format: ${uri.substring(0, 50)}...`);
    
  } catch (error) {
    console.error('❌ Error converting URI to blob:', error);
    throw error instanceof Error ? error : new Error('Failed to convert URI to blob');
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
   * PERBAIKAN: Improved image compression with better error handling
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

      // Validate source file for file:// URIs
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          return {
            uri: null,
            error: 'Source image file does not exist',
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

      // Validate compressed file
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
   * PERBAIKAN: Simplified and more reliable selfie upload
   */
  async uploadSelfie(
    userId: string,
    imageUri: string,
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general',
    options?: ImageCompressionOptions
  ): Promise<ImageUploadResult> {
    try {
      console.log('=== 🚀 Starting Selfie Upload ===');
      console.log('👤 User ID:', userId);
      console.log('🖼️ Image URI:', imageUri);
      console.log('📝 Type:', type);

      // Step 1: Compress image
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

      // Step 2: Convert to blob
      const blob = await uriToBlob(compressionResult.uri);
      
      if (blob.size === 0) {
        return {
          url: null,
          error: 'Processed image is empty',
        };
      }
      
      // Step 3: Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${userId}/selfies/${type}_${timestamp}.jpg`;
      
      console.log('📤 Uploading selfie:', {
        fileName,
        blobSize: blob.size,
        blobType: blob.type
      });

      // Step 4: Upload to Supabase
      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob, {
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

      // Step 5: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(data.path);

      console.log('✅ Selfie upload successful:', publicUrl);

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
   * PERBAIKAN UTAMA: Completely rewritten profile photo upload
   */
  async uploadProfilePhoto(
    userId: string,
    imageUri: string,
    options?: ImageCompressionOptions
  ): Promise<ImageUploadResult> {
    try {
      console.log('=== 🚀 Starting Profile Photo Upload ===');
      console.log('👤 User ID:', userId);
      console.log('🖼️ Original image URI:', imageUri);

      // Step 1: Validate inputs
      if (!userId || !imageUri) {
        return {
          url: null,
          error: 'User ID and image URI are required',
        };
      }

      // Step 2: Validate source file
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

      // Step 3: Compress image with optimal settings
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

      // Step 4: Convert to blob with improved error handling
      console.log('🔄 Converting to blob...');
      let blob: Blob;
      
      try {
        blob = await uriToBlob(compressionResult.uri);
      } catch (blobError) {
        console.error('❌ Blob conversion failed:', blobError);
        return {
          url: null,
          error: `Failed to process image: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`,
        };
      }
      
      // Step 5: Validate blob
      console.log('🔍 Validating blob:', {
        size: blob.size,
        type: blob.type,
        constructor: blob.constructor.name
      });
      
      if (!blob || blob.size === 0) {
        return {
          url: null,
          error: 'Processed image is empty',
        };
      }

      if (blob.size > 2 * 1024 * 1024) { // 2MB limit for avatars
        return {
          url: null,
          error: 'Compressed image is still too large (max 2MB for avatars)',
        };
      }
      
      // Step 6: Generate filename with timestamp
      const timestamp = Date.now();
      const fileName = `${userId}/profile/avatar_${timestamp}.jpg`;
      
      console.log('📤 Uploading to Supabase:', {
        bucket: 'avatars',
        fileName,
        blobSize: blob.size,
        blobType: blob.type
      });

      // Step 7: Upload with single attempt (no retry for simplicity)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
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

      // Step 8: Get public URL with cache busting
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
   * Update user profile with new avatar URL
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
   * Get all selfies for a user (for history/gallery view)
   */
  async getUserSelfies(userId: string): Promise<{ urls: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from('selfies')
        .list(`${userId}/selfies`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        return { urls: [], error: handleSupabaseError(error) };
      }

      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('selfies')
          .getPublicUrl(`${userId}/selfies/${file.name}`);
        return publicUrl;
      });

      return { urls, error: null };
    } catch (error) {
      return { urls: [], error: handleSupabaseError(error) };
    }
  }

  /**
   * PERBAIKAN: Simplified complete profile photo update workflow
   */
  async updateProfilePhotoComplete(
    userId: string,
    imageUri: string
  ): Promise<{ avatarUrl: string | null; error: string | null }> {
    try {
      console.log('=== 🚀 Starting Complete Profile Photo Update ===');
      
      if (!userId || !imageUri) {
        return {
          avatarUrl: null,
          error: 'Missing required parameters',
        };
      }

      // Step 1: Upload image
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
        // Rollback: delete uploaded image if profile update fails
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
   * PERBAIKAN: Validate image file before processing
   */
  async validateImageFile(uri: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!uri) {
        return { isValid: false, error: 'No image URI provided' };
      }

      // For file:// URIs, check file system
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

      // For HTTP URLs, try to fetch headers
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
   * Get storage usage for debugging
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