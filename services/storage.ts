import { supabase, handleSupabaseError } from '@/lib/supabase';
import { imageService } from './imageService';

export const storageService = {
  // Upload selfie image (deprecated - use imageService instead)
  async uploadSelfie(userId: string, imageUri: string, type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general'): Promise<{ url: string | null; error: string | null }> {
    console.warn('storageService.uploadSelfie is deprecated. Use imageService.uploadSelfie instead.');
    // @ts-ignore: Property 'uploadSelfie' does not exist on type 'ImageService'.
    return imageService.uploadSelfie(userId, imageUri, type);
  },

  // Upload receipt image
  async uploadReceipt(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileName = `${userId}/receipts/receipt_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        return { url: null, error: handleSupabaseError(error) };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error: handleSupabaseError(error) };
    }
  },

  // Upload avatar image (deprecated - use imageService instead)
  async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
    console.warn('storageService.uploadAvatar is deprecated. Use imageService.uploadProfilePhoto instead.');
    const result = await imageService.updateProfilePhotoComplete(userId, imageUri);
    return { url: result.avatarUrl, error: result.error };
  },

  // Delete file
  async deleteFile(bucket: string, path: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Get storage usage statistics
  async getStorageUsage(userId: string): Promise<{ 
    selfiesCount: number; 
    avatarsCount: number; 
    receiptsCount: number; 
    totalSize: number; 
    error: string | null 
  }> {
    try {
      const [selfiesResult, avatarsResult, receiptsResult] = await Promise.all([
        supabase.storage.from('selfies').list(`${userId}/selfies`),
        supabase.storage.from('avatars').list(`${userId}/profile`),
        supabase.storage.from('receipts').list(`${userId}/receipts`),
      ]);

      const selfiesCount = selfiesResult.data?.length || 0;
      const avatarsCount = avatarsResult.data?.length || 0;
      const receiptsCount = receiptsResult.data?.length || 0;

      // Calculate total size (approximate)
      const totalSize = [
        ...(selfiesResult.data || []),
        ...(avatarsResult.data || []),
        ...(receiptsResult.data || []),
      ].reduce((total, file) => total + (file.metadata?.size || 0), 0);

      return {
        selfiesCount,
        avatarsCount,
        receiptsCount,
        totalSize,
        error: null,
      };
    } catch (error) {
      return {
        selfiesCount: 0,
        avatarsCount: 0,
        receiptsCount: 0,
        totalSize: 0,
        error: handleSupabaseError(error),
      };
    }
  },
};