import { supabase } from '../lib/supabase';

/**
 * Mencatat data check-in baru ke tabel 'attendances'
 * @param {object} checkInData - Data untuk check-in
 * @param {string} checkInData.employee_id - ID pengguna yang melakukan check-in
 * @param {string} checkInData.check_in_location - Koordinat lokasi check-in
 * @param {string} checkInData.check_in_photo_url - URL foto selfie saat check-in
 */
export const addCheckIn = async (checkInData) => {
  const { data, error } = await supabase
    .from('attendances')
    .insert([
      { ...checkInData, check_in_time: new Date() }
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Mengambil riwayat absensi untuk seorang pengguna
 * @param {string} employeeId - ID pengguna
 */
export const getAttendanceHistory = async (employeeId) => {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('employee_id', employeeId)
    .order('check_in_time', { ascending: false });

  if (error) throw error;
  return data;
};

// Anda bisa menambahkan fungsi untuk check_out, start_break, dll di sini