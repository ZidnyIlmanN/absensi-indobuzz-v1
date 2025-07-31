import { supabase, handleSupabaseError } from '@/lib/supabase';
import { User } from '@/types';

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

export const authService = {
  // Sign up new user
  async signUp({ email, password, name }: AuthCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || 'New User',
          },
        },
      });

      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      if (data.user) {
        // Get the created profile
        const profile = await this.getProfile(data.user.id);
        return { user: profile, error: null };
      }

      return { user: null, error: 'Failed to create user' };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Sign in existing user
  async signIn({ email, password }: AuthCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      if (data.user) {
        const profile = await this.getProfile(data.user.id);
        return { user: profile, error: null };
      }

      return { user: null, error: 'Failed to sign in' };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Sign out user
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        return { user: profile, error: null };
      }

      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Get user profile
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        position: data.position || '',
        department: data.department || '',
        avatar: data.avatar_url || '',
        employeeId: data.employee_id,
        joinDate: data.join_date || '',
        location: data.location || '',
        workSchedule: data.work_schedule || '09:00-18:00',
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          position: updates.position,
          department: updates.department,
          avatar_url: updates.avatar,
          join_date: updates.joinDate,
          location: updates.location,
          work_schedule: updates.workSchedule,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        callback(profile);
      } else {
        callback(null);
      }
    });
  },
};