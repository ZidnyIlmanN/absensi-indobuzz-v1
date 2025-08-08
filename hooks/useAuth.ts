import { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { User } from '@/types';
import { AppState, AppStateStatus } from 'react-native';
import { sessionManager } from '@/services/sessionManager';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  useEffect(() => {
    console.log('[useAuth] Checking initial session...');
    
    const initializeAuth = async () => {
      try {
        // Initialize session manager first
        const sessionResult = await authService.initializeSession();
        
        if (sessionResult.user) {
          console.log('[useAuth] Session restored from storage');
          setAuthState({
            user: sessionResult.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          return;
        }

        // If no stored session, check current Supabase session using safe method
        const currentSessionResult = await authService.getCurrentSessionSafe();
        console.log('[useAuth] Current session result:', { user: currentSessionResult.user, error: currentSessionResult.error });
        
        setAuthState({
          user: currentSessionResult.user,
          isLoading: false,
          isAuthenticated: !!currentSessionResult.user,
          error: currentSessionResult.error,
        });
      } catch (error) {
        console.error('[useAuth] Error during auth initialization:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Auth initialization error',
        }));
      }
    };

    // Add timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      console.warn('[useAuth] Auth initialization timeout');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication timeout - please try again',
      }));
    }, 15000); // Increase timeout to 15 seconds

    initializeAuth();

    return () => clearTimeout(timeout);

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('[useAuth] Auth state changed:', user);
      // Avoid async callback directly, call async function inside
      const updateUser = async () => {
        if (user) {
          setAuthState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setAuthState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      };
      updateUser();
    });

    // Listen to app state changes to refresh session on app focus/resume
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[useAuth] App has come to foreground, refreshing user session...');
        // Check if session needs refresh when app becomes active
        sessionManager.getStoredSession().then(result => {
          if (result.needsRefresh) {
            console.log('[useAuth] Session needs refresh on app resume');
            sessionManager.refreshSession();
          }
        });
      }
    };

    const subscriptionAppState = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.unsubscribe();
      subscriptionAppState.remove();
      sessionManager.cleanup();
    };
  }, []);

  // New function to refresh user data from backend
  const refreshUser = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, error } = await authService.getCurrentSession();
      if (!error) {
        setAuthState(prev => ({
          ...prev,
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error,
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { user, error } = await authService.signIn({ email, password });
    
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
      error,
    });

    return { user, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { user, error } = await authService.signUp({ email, password, name });
    
    // Do not set isAuthenticated to true after sign up
    setAuthState(prev => ({
      ...prev,
      user: null, // Clear any potential user object
      isLoading: false,
      isAuthenticated: false,
      error,
    }));

    return { user, error };
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await authService.signOut();
    
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error,
    });

    return { error };
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.user) return { error: 'No user logged in' };

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const { error } = await authService.updateProfile(authState.user.id, updates);

    if (!error) {
      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
        isLoading: false,
      }));
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false, error }));
    }

    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
  };
}
