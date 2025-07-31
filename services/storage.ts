import { supabase, handleSupabaseError } from '@/lib/supabase';

export const storageService = {
  // Upload selfie image
  async uploadSelfie(userId: string, imageUri: string, type: 'clock_in' | 'clock_out'): Promise<{ url: string | null; error: string | null }> {
    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileName = `${userId}/${type}_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        return { url: null, error: handleSupabaseError(error) };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error: handleSupabaseError(error) };
    }
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

  // Upload avatar image
  async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileName = `${userId}/avatar.jpg`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true, // Allow overwriting existing avatar
        });

      if (error) {
        return { url: null, error: handleSupabaseError(error) };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error: handleSupabaseError(error) };
    }
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
};