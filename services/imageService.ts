import { supabase, handleSupabaseError } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
   * Compress and optimize image before upload
   */
  async compressImage(
    uri: string, 
    options: ImageCompressionOptions = { quality: 0.8 }
  ): Promise<{ uri: string | null; error: string | null }> {
    try {
      const manipulatorOptions: ImageManipulator.ImageManipulatorOptions = {
        compress: options.quality,
        format: options.format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
      };

      // Add resize if dimensions are specified
      const actions: ImageManipulator.Action[] = [];
      if (options.maxWidth || options.maxHeight) {
        actions.push({
          resize: {
            width: options.maxWidth,
            height: options.maxHeight,
          },
        });
      }

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        manipulatorOptions
      );

      return {
        uri: result.uri,
        error: null,
      };
    } catch (error) {
      console.error('Image compression error:', error);
      return {
        uri: null,
        error: error instanceof Error ? error.message : 'Image compression failed',
      };
    }
  }

  /**
   * Upload selfie to Supabase Storage
   */
  async uploadSelfie(
    userId: string,
    imageUri: string,
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general',
    options?: ImageCompressionOptions
  ): Promise<ImageUploadResult> {
    try {
      // Compress image before upload
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

      // Convert image URI to blob
      const response = await fetch(compressionResult.uri);
      const blob = await response.blob();
      
      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${userId}/selfies/${type}_${timestamp}.jpg`;
      
      console.log(`Uploading selfie: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '3600', // Cache for 1 hour
        });

      if (error) {
        console.error('Selfie upload error:', error);
        return { 
          url: null, 
          error: handleSupabaseError(error),
          fileName,
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(data.path);

      console.log(`Selfie uploaded successfully: ${publicUrl}`);

      return { 
        url: publicUrl, 
        error: null,
        fileName: data.path,
      };
    } catch (error) {
      console.error('Selfie upload error:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload profile photo to Supabase Storage
   */
  async uploadProfilePhoto(
    userId: string,
    imageUri: string,
    options?: ImageCompressionOptions
  ): Promise<ImageUploadResult> {
    try {
      // Compress image with profile-specific settings
      const compressionResult = await this.compressImage(imageUri, {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        format: 'jpeg',
        ...options,
      });

      if (compressionResult.error || !compressionResult.uri) {
        return {
          url: null,
          error: compressionResult.error || 'Image compression failed',
        };
      }

      // Convert image URI to blob
      const response = await fetch(compressionResult.uri);
      const blob = await response.blob();
      
      // Use consistent filename for profile photos (will overwrite previous)
      const fileName = `${userId}/profile/avatar.jpg`;
      
      console.log(`Uploading profile photo: ${fileName}`);

      // Delete existing profile photo first (optional, since we're using upsert)
      try {
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
      } catch (deleteError) {
        // Ignore delete errors - file might not exist
        console.log('Previous profile photo not found or could not be deleted');
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true, // Allow overwriting existing profile photo
          cacheControl: '3600',
        });

      if (error) {
        console.error('Profile photo upload error:', error);
        return { 
          url: null, 
          error: handleSupabaseError(error),
          fileName,
        };
      }

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path, {
          transform: {
            width: 400,
            height: 400,
            quality: 80,
          },
        });

      // Add timestamp to URL for cache busting
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      console.log(`Profile photo uploaded successfully: ${cacheBustedUrl}`);

      return { 
        url: cacheBustedUrl, 
        error: null,
        fileName: data.path,
      };
    } catch (error) {
      console.error('Profile photo upload error:', error);
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
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { error: null };
    } catch (error) {
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
   * Complete profile photo update workflow
   */
  async updateProfilePhotoComplete(
    userId: string,
    imageUri: string
  ): Promise<{ avatarUrl: string | null; error: string | null }> {
    try {
      // Upload the image
      const uploadResult = await this.uploadProfilePhoto(userId, imageUri);
      
      if (uploadResult.error || !uploadResult.url) {
        return {
          avatarUrl: null,
          error: uploadResult.error || 'Upload failed',
        };
      }

      // Update profile record
      const updateResult = await this.updateProfileAvatar(userId, uploadResult.url);
      
      if (updateResult.error) {
        // If profile update fails, try to clean up uploaded image
        if (uploadResult.fileName) {
          await this.deleteImage('avatars', uploadResult.fileName);
        }
        
        return {
          avatarUrl: null,
          error: updateResult.error,
        };
      }

      return {
        avatarUrl: uploadResult.url,
        error: null,
      };
    } catch (error) {
      return {
        avatarUrl: null,
        error: error instanceof Error ? error.message : 'Profile photo update failed',
      };
    }
  }
}

// Convenience instance
export const imageService = ImageService.getInstance();