import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="splash" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="clock-in" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="timeoff" />
            <Stack.Screen name="reimburse" />
            <Stack.Screen name="message" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="help" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
