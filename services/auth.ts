import { supabase, handleSupabaseError } from '@/lib/supabase';
import { User } from '@/types';
import { sessionManager } from './sessionManager';
import { secureStorage, STORAGE_KEYS } from './secureStorage';

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
        console.error('Supabase signUp error:', error);
        return { user: null, error: handleSupabaseError(error) };
      }

      if (data.user) {
        // Save session data after successful signup
        if (data.session) {
          await this.saveSessionData(data.session, data.user.id);
        }

        // Try to get the created profile
        let profile = await this.getProfile(data.user.id);
        if (!profile) {
          // Profile not found, possibly trigger did not run or error occurred
          console.error('Profile not found for user id:', data.user.id);
          return { user: null, error: 'User profile not found after registration' };
        }
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
        // Save session data after successful login
        await this.saveSessionData(data.session, data.user.id);

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
      // Clear stored session data
      await sessionManager.clearSession();
      
      const { error } = await supabase.auth.signOut();
      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Get current session
  async getCurrentSession(): Promise<AuthResponse> {
    try {
      // First, try to get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        return { user: profile, error: null };
      }

      // If no active session, try to restore from secure storage
      console.log('No active session found, checking stored session...');
      const storedSessionResult = await sessionManager.getStoredSession();
      
      if (storedSessionResult.isValid && storedSessionResult.user) {
        console.log('Valid stored session found, restoring...');
        return { user: storedSessionResult.user, error: null };
      }
      
      if (storedSessionResult.needsRefresh) {
        console.log('Stored session needs refresh, attempting...');
        const refreshResult = await sessionManager.refreshSession();
        
        if (refreshResult.success) {
          // Try to get session again after refresh
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          if (refreshedSession?.user) {
            const profile = await this.getProfile(refreshedSession.user.id);
            return { user: profile, error: null };
          }
        }
      }
      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Get current session without circular calls
  async getCurrentSessionSafe(): Promise<AuthResponse> {
    try {
      // Only check Supabase for current session, don't try to restore from storage
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

  // Save session data securely
  async saveSessionData(session: any, userId: string): Promise<void> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const sessionData = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: Date.now() + (session.expires_in * 1000),
        user: profile,
      };

      await sessionManager.saveSession(sessionData);
    } catch (error) {
      console.error('Failed to save session data:', error);
      // Don't throw error here to avoid breaking the login flow
    }
  },

  // Initialize session manager
  async initializeSession(): Promise<AuthResponse> {
    try {
      const result = await sessionManager.initialize();
      return {
        user: result.user,
        error: result.error || null,
      };
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
        totalWorkHours: data.total_work_hours || 0,
        totalDays: data.total_days || 0,
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ error: string | null }> {
    try {
      const joinDateValue = updates.joinDate === '' ? null : updates.joinDate;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          position: updates.position,
          department: updates.department,
          avatar_url: updates.avatar,
          join_date: joinDateValue,
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
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, !!session);
      
      if (session?.user) {
        // Save session data when auth state changes to signed in
        await this.saveSessionData(session, session.user.id);
        const profile = await this.getProfile(session.user.id);
        callback(profile);
      } else {
        // Clear session data when signed out
        await sessionManager.clearSession();
        callback(null);
      }
    });
  },
};