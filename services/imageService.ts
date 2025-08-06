import { supabase, handleSupabaseError } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    if (!uri || uri.trim() === '') {
      throw new Error('Invalid URI provided');
    }

    console.log('🔄 Converting URI to blob:', uri);

    // Method 1: Untuk file:// URIs
    if (uri.startsWith('file://')) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('📁 File info:', fileInfo);
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
        
        if (fileInfo.size === 0) {
          throw new Error('File is empty');
        }

        // Baca file sebagai base64
        console.log('📖 Reading file as base64...');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (!base64 || base64.length === 0) {
          throw new Error('Failed to read file as base64');
        }

        console.log('✅ Base64 read successful, length:', base64.length);

        // PERBAIKAN 1: Validasi base64 format
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64)) {
          throw new Error('Invalid base64 format');
        }

        // PERBAIKAN 2: Gunakan fetch dengan data URL (React Native compatible)
        const mimeType = 'image/jpeg'; // Default ke JPEG
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        console.log('🔄 Creating blob from data URL...');
        console.log('📊 Data URL length:', dataUrl.length);
        
        // Method A: Direct fetch dari data URL
        try {
          const response = await fetch(dataUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to process data URL: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          
          console.log('✅ Blob created via FileSystem method:', {
            size: blob.size,
            type: blob.type,
            originalFileSize: fileInfo.size,
            base64Length: base64.length
          });

          // VALIDASI KRITIS: Pastikan blob tidak kosong
          if (blob.size === 0) {
            throw new Error('Generated blob is empty');
          }
          
          return blob;
        } catch (fetchError) {
          console.warn('⚠️ Data URL fetch failed, trying alternative method:', fetchError);
          
          // Method B: Fallback menggunakan XMLHttpRequest untuk blob creation
          try {
            console.log('🔄 Trying XMLHttpRequest fallback...');
            
            const xhr = new XMLHttpRequest();
            const xhrPromise = new Promise<Blob>((resolve, reject) => {
              xhr.onload = () => {
                if (xhr.status === 200 && xhr.response) {
                  console.log('✅ XHR blob created:', {
                    size: xhr.response.size,
                    type: xhr.response.type
                  });
                  resolve(xhr.response);
                } else {
                  reject(new Error(`XHR failed: ${xhr.status}`));
                }
              };
              xhr.onerror = () => reject(new Error('XHR error'));
              xhr.ontimeout = () => reject(new Error('XHR timeout'));
            });
            
            xhr.open('GET', dataUrl);
            xhr.responseType = 'blob';
            xhr.timeout = 10000; // 10 second timeout
            xhr.send();
            
            const xhrBlob = await xhrPromise;
            
            if (xhrBlob.size === 0) {
              throw new Error('XHR generated blob is empty');
            }
            
            return xhrBlob;
          } catch (xhrError) {
            console.error('❌ XHR fallback also failed:', xhrError);
            const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
            const xhrErrorMsg = xhrError instanceof Error ? xhrError.message : String(xhrError);
            throw new Error(`All blob creation methods failed. Fetch: ${fetchErrorMsg}, XHR: ${xhrErrorMsg}`);
          }
        }
      } catch (fsError) {
        console.warn('⚠️ FileSystem method failed:', fsError);
        throw fsError; // Jangan fallback, langsung throw error
      }
    }

    // Method 2: Untuk HTTP/HTTPS URLs
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('🌐 Fetching from HTTP URL...');
      const response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('HTTP response blob is empty');
      }
      
      console.log('✅ Blob created via HTTP fetch:', {
        size: blob.size,
        type: blob.type
      });

      return blob;
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
   * PERBAIKAN: Compress and optimize image with better error handling
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

      console.log('Starting image compression:', uri);

      // Validasi file exists sebelum kompresi
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          return {
            uri: null,
            error: 'Source image file does not exist',
          };
        }
        console.log('Source file info:', fileInfo);
      }

      const manipulatorOptions: ImageManipulator.SaveOptions = {
        compress: options.quality,
        format: options.format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        base64: false, // PENTING: Pastikan base64 false untuk menghemat memory
      };
      
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

      if (!result.uri) {
        return {
          uri: null,
          error: 'Image manipulation failed - no output URI',
        };
      }

      // Validasi hasil kompresi
      const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('Compressed file info:', compressedFileInfo);
      
      if (!compressedFileInfo.exists || compressedFileInfo.size === 0) {
        return {
          uri: null,
          error: 'Compressed image is empty or invalid',
        };
      }

      console.log('Image compression successful:', {
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

      const blob = await uriToBlob(compressionResult.uri);
      
      if (blob.size === 0) {
        return {
          url: null,
          error: 'Image file is empty after processing',
        };
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${userId}/selfies/${type}_${timestamp}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        return { 
          url: null, 
          error: handleSupabaseError(error),
          fileName,
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(data.path);

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
   * PERBAIKAN UTAMA: Upload profile photo with enhanced error handling
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

      // Step 1: Validasi parameter
      if (!userId || !imageUri) {
        return {
          url: null,
          error: 'User ID and image URI are required',
        };
      }

      // Step 2: Validasi file exists untuk file:// URI
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
      }

      // Step 3: Compress image
      console.log('🔄 Starting image compression...');
      
      const compressionOptions = {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        format: 'jpeg' as const,
        ...options,
      };
      
      console.log('⚙️ Compression options:', compressionOptions);
      
      const compressionResult = await this.compressImage(imageUri, compressionOptions);

      if (compressionResult.error || !compressionResult.uri) {
        console.error('❌ Compression failed:', compressionResult.error);
        return {
          url: null,
          error: compressionResult.error || 'Image compression failed',
        };
      }

      console.log('✅ Compression successful:', compressionResult.uri);

      // Step 4: Validasi compressed file
      if (compressionResult.uri.startsWith('file://')) {
        const compressedInfo = await FileSystem.getInfoAsync(compressionResult.uri);
        console.log('📁 Compressed file info:', compressedInfo);
        
        if (!compressedInfo.exists || compressedInfo.size === 0) {
          return {
            url: null,
            error: 'Compressed image is invalid or empty',
          };
        }
      }

      // Step 5: Convert URI to Blob dengan debugging detail
      console.log('🔄 Converting compressed URI to blob...');
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
      
      console.log('✅ Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        constructor: blob.constructor.name
      });
      
      // VALIDASI KRITIS: Pastikan blob valid sebelum upload
      if (!blob) {
        console.error('❌ Blob is null or undefined');
        return {
          url: null,
          error: 'Failed to create blob - blob is null',
        };
      }
      
      if (blob.size === 0) {
        console.error('❌ Blob size is 0');
        return {
          url: null,
          error: 'Processed image is empty - blob size is 0 bytes',
        };
      }

      if (blob.size > 10 * 1024 * 1024) { // 10MB limit
        console.error('❌ Blob too large:', blob.size);
        return {
          url: null,
          error: 'Image is too large (max 10MB)',
        };
      }
      
      // Step 6: Test blob readability (React Native compatible)
      try {
        console.log('🔍 Testing blob readability...');
        
        // Method 1: Test dengan FileReader (React Native compatible)
        const reader = new FileReader();
        const readPromise = new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result;
            if (result && typeof result === 'string' && result.length > 0) {
              console.log('✅ Blob is readable via FileReader, data length:', result.length);
              resolve(result);
            } else {
              reject(new Error('FileReader returned empty result'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
        });
        
        // Set timeout untuk FileReader
        setTimeout(() => {
          if (reader.readyState === FileReader.LOADING) {
            reader.abort();
          }
        }, 5000);
        
        reader.readAsDataURL(blob);
        await readPromise;
        
        console.log('✅ Blob readability test passed');
      } catch (readError) {
        console.error('❌ Blob read test failed:', readError);
        
        // Jangan langsung return error, coba lanjut upload
        // Karena blob sudah terbuat dengan sukses dari data URL
        console.log('⚠️ Continuing with upload despite read test failure...');
      }
      
      // Step 7: Create filename
      const timestamp = Date.now();
      const fileName = `${userId}/profile/avatar_${timestamp}.jpg`;
      
      console.log('📤 Uploading to Supabase:', {
        bucket: 'avatars',
        fileName,
        blobSize: blob.size,
        blobType: blob.type
      });

      // Step 8: Upload dengan retry
      const uploadResult = await this.uploadWithRetry('avatars', fileName, blob);
      
      if (uploadResult.error) {
        console.error('❌ Upload failed:', uploadResult.error);
        return { 
          url: null, 
          error: uploadResult.error,
          fileName,
        };
      }

      console.log('✅ Upload successful:', uploadResult.data);

      // Step 9: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadResult.data.path);

      const cacheBustedUrl = `${publicUrl}?t=${timestamp}`;
      
      console.log('=== 🎉 Profile Photo Upload Complete ===');
      console.log('🔗 Final URL:', cacheBustedUrl);

      return { 
        url: cacheBustedUrl, 
        error: null,
        fileName: uploadResult.data.path,
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
   * PERBAIKAN: Upload with retry mechanism yang lebih robust
   */
private async uploadWithRetry(
    bucket: string,
    fileName: string,
    blob: Blob,
    maxRetries = 3
  ): Promise<{ data: any; error: string | null }> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Upload attempt ${attempt}/${maxRetries}`);
        
        // Pre-upload validation
        console.log('🔍 Pre-upload blob validation:', {
          size: blob.size,
          type: blob.type,
          constructor: blob.constructor.name,
          isBlob: blob instanceof Blob
        });
        
        if (!blob || blob.size === 0) {
          throw new Error('Blob is empty or invalid before upload');
        }

        // Test blob before upload (React Native compatible)
        try {
          console.log('🔍 Pre-upload blob test...');
          
          // Method 1: Test dengan slice (lebih ringan)
          const testSlice = blob.slice(0, 100);
          console.log('✅ Blob slice test passed:', {
            originalSize: blob.size,
            sliceSize: testSlice.size,
            sliceType: testSlice.type
          });
          
          // Method 2: Test dengan FileReader untuk memastikan data ada
          if (attempt === 1) { // Only test on first attempt
            const reader = new FileReader();
            const testPromise = new Promise((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result;
                if (result && typeof result === 'string' && result.startsWith('data:')) {
                  console.log('✅ Blob contains valid data URL');
                  resolve(result);
                } else {
                  reject(new Error('Blob does not contain valid data'));
                }
              };
              reader.onerror = () => reject(new Error('FileReader test failed'));
            });
            
            reader.readAsDataURL(testSlice);
            await testPromise;
          }
          
        } catch (sliceError) {
          console.error('❌ Blob test failed:', sliceError);
          // Don't throw error, just log warning since blob was created successfully
          console.log('⚠️ Continuing with upload despite test failure...');
        }
        
        const uploadOptions = {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        };
        
        console.log('⚙️ Upload options:', uploadOptions);
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, blob, uploadOptions);

        if (error) {
          lastError = error;
          console.warn(`⚠️ Upload attempt ${attempt} failed:`, error);
          
          // Don't retry certain errors
          if (error.message?.includes('Duplicate') || error.message?.includes('already exists')) {
            console.log('ℹ️ File already exists, treating as success');
            return { data: { path: fileName }, error: null };
          }
          
          // Delay before retry
          if (attempt < maxRetries) {
            const delay = 1000 * attempt;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else {
          console.log(`✅ Upload successful on attempt ${attempt}`);
          console.log('📊 Upload result:', data);
          return { data, error: null };
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ Upload attempt ${attempt} error:`, error);
        
        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const finalError = handleSupabaseError(lastError) || 'Upload failed after all retries';
    console.error('❌ All upload attempts failed:', finalError);
    return { 
      data: null, 
      error: finalError
    };
  }

  /**
   * Update user profile with new avatar URL
   */
  async updateProfileAvatar(userId: string, avatarUrl: string): Promise<{ error: string | null }> {
    try {
      console.log('Updating profile avatar for user:', userId);
      console.log('New avatar URL:', avatarUrl);

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Profile update error:', error);
        return { error: handleSupabaseError(error) };
      }

      console.log('Profile avatar updated successfully');
      return { error: null };
    } catch (error) {
      console.error('Update profile avatar error:', error);
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
      console.log('Starting complete profile photo update workflow');
      
      if (!userId || !imageUri) {
        return {
          avatarUrl: null,
          error: 'Missing required parameters',
        };
      }

      const uploadResult = await this.uploadProfilePhoto(userId, imageUri);
      
      if (uploadResult.error || !uploadResult.url) {
        return {
          avatarUrl: null,
          error: uploadResult.error || 'Upload failed',
        };
      }

      const updateResult = await this.updateProfileAvatar(userId, uploadResult.url);
      
      if (updateResult.error) {
        // Rollback: delete uploaded image if profile update fails
        if (uploadResult.fileName) {
          console.log('Rolling back upload due to profile update failure');
          await this.deleteImage('avatars', uploadResult.fileName);
        }
        
        return {
          avatarUrl: null,
          error: updateResult.error,
        };
      }

      console.log('Profile photo update workflow completed successfully');
      return {
        avatarUrl: uploadResult.url,
        error: null,
      };
    } catch (error) {
      console.error('Profile photo update workflow error:', error);
      return {
        avatarUrl: null,
        error: error instanceof Error ? error.message : 'Profile photo update failed',
      };
    }
  }
}

// Convenience instance
export const imageService = ImageService.getInstance();