import { supabase } from '../lib/supabase';

/**
 * Mengambil data profil dari tabel 'profiles' berdasarkan ID pengguna
 * @param {string} userId - ID pengguna dari Supabase Auth
 */
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single(); // .single() untuk mengambil satu baris data

  if (error) throw error;
  return data;
};

/**
 * Memperbarui data profil
 * @param {string} userId - ID pengguna
 * @param {object} updates - Data yang akan diperbarui, cth: { full_name: 'Nama Baru' }
 */
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data;
};