import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';
import { AuthGuard } from '@/components/AuthGuard';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="splash" />
              <Stack.Screen name="splash-to-main" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="clock-in" />
              <Stack.Screen name="clock-out" />
              <Stack.Screen name="attendance" />
              <Stack.Screen name="live-attendance" />
              <Stack.Screen name="attendance-history" />
              <Stack.Screen name="timeoff" />
              <Stack.Screen name="reimburse" />
              <Stack.Screen name="message" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="privacy" />
              <Stack.Screen name="help" />
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="shift-schedule" />
              <Stack.Screen name="start-break" />
              <Stack.Screen name="end-break" />
              <Stack.Screen name="start-overtime" />
              <Stack.Screen name="end-overtime" />
              <Stack.Screen name="start-client-visit" />
              <Stack.Screen name="end-client-visit" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGuard>
          <StatusBar style="auto" />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
