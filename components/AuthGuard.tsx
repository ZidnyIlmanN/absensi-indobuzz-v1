import React, { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import SplashScreen from '@/app/splash';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAppContext();
  const segments = useSegments();

  useEffect(() => {
    console.log('[AuthGuard] isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'segments:', segments);
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inSplash = (segments[0] as string) === 'splash';

    if (!isAuthenticated && !inAuthGroup && !inSplash) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated and in auth screens
      router.replace('/(tabs)');
    }
  }, [user, isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <SplashScreen />;
  }

  // Ensure children is properly handled
  if (!children) {
    return null;
  }

  return <>{children}</>;
}
