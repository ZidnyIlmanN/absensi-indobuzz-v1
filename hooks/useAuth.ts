import { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { User } from '@/types';
import { AppState, AppStateStatus } from 'react-native';

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
    // Add timeout to avoid indefinite loading
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      console.warn('[useAuth] getCurrentSession timeout, setting isLoading to false');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Session check timed out',
      }));
    }, 10000); // 10 seconds timeout

    // Check initial session
    authService.getCurrentSession().then(({ user, error }) => {
      if (didTimeout) {
        // Already timed out, ignore result
        return;
      }
      clearTimeout(timeoutId);
      console.log('[useAuth] Initial session result:', { user, error });
      console.log('[useAuth] AuthState after initial session check:', { user, isAuthenticated: !!user, isLoading: false, error });
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error,
      });
    }).catch((error) => {
      if (!didTimeout) {
        clearTimeout(timeoutId);
        console.error('[useAuth] Error during getCurrentSession:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Error during session check',
        }));
      }
    });

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
        refreshUser();
      }
    };

    const subscriptionAppState = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.unsubscribe();
      subscriptionAppState.remove();
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
    
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
      error,
    });

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
