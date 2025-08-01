import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useAppContext();
  const segments = useSegments();

  useEffect(() => {
    if (state.isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSplash = segments[0] === 'splash';
    const inSplashToMain = segments[0] === 'splash-to-main';

    if (!state.isAuthenticated && !inAuthGroup && !inSplash && !inSplashToMain) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (state.isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated and in auth screens
      router.replace('/splash-to-main');
    }
  }, [state.user, state.isAuthenticated, state.isLoading, segments]);

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Loading..." />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});