import { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { User } from '@/types';

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
    // Check initial session
    authService.getCurrentSession().then(({ user, error }) => {
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error,
      });
    });

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }));
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
  };
}