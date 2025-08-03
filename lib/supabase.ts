import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const manifest = Constants.manifest ?? Constants.expoConfig;
const supabaseUrl = manifest?.extra?.supabaseUrl!;
const supabaseAnonKey = manifest?.extra?.supabaseAnonKey!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});


// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return error?.message || 'An unexpected error occurred';
};

// Real-time subscription helper
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
