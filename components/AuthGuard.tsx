import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAppContext();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSplash = segments[0] === 'splash';

    if (!isAuthenticated && !inAuthGroup && !inSplash) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated and in auth screens
      router.replace('/(tabs)');
    }
  }, [user, isAuthenticated, isLoading, segments]);

  if (isLoading) {
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