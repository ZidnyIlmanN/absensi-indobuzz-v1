import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider, useAppContext } from '../context/AppContext';
import SplashScreen from './splash'; // Impor splash screen Anda
import { customTransition } from '../constants/Transitions';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAppContext();
  const segments = useSegments();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Jangan lakukan apa-apa jika masih loading
    if (isLoading) {
      return;
    }

    console.log('Routing check - segments:', segments);
    console.log('Routing check - isAuthenticated:', isAuthenticated);

    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === '(auth)';

    const isLiveAttendanceProtected = segments[0] === 'live-attendance-protected';

    const isClockInRoute = segments[0] === 'clock-in';
    const isAllFeaturesRoute = segments[0] === 'lihat-semua';

    const isShiftScheduleRoute = segments[0] === 'shift-schedule';
    const isAttendanceHistoryRoute = segments[0] === 'attendance-history';
    const isClockOutRoute = segments[0] === 'clock-out';
    const isStartBreakRoute = segments[0] === 'start-break';
    const isEndBreakRoute = segments[0] === 'end-break';
    const isTimeOffRoute = segments[0] === 'timeoff';
    const isReimburseRoute = segments[0] === 'reimburse';
    const isSettingsRoute = segments[0] === 'settings';
    const isNotificationsRoute = segments[0] === 'notifications';
    const isPrivacyRoute = segments[0] === 'privacy';
    const isHelpRoute = segments[0] === 'help';
    
    console.log('Routing check - route flags:', {
      inTabsGroup,
      inAuthGroup,
      isLiveAttendanceProtected,
      isClockInRoute,
      isShiftScheduleRoute,
      isAttendanceHistoryRoute,
      isClockOutRoute,
      isStartBreakRoute,
      isEndBreakRoute,
      isTimeOffRoute,
      isReimburseRoute,
      isSettingsRoute,
      isNotificationsRoute,
      isPrivacyRoute,
      isHelpRoute,
      isAllFeaturesRoute,
    });

    // Prevent redirect loops
    if (hasRedirected) {
      console.log('Routing check - already redirected, skipping');
      return;
    }

    if (isAuthenticated && !inTabsGroup && !isLiveAttendanceProtected && !isClockInRoute && !isShiftScheduleRoute && !isAttendanceHistoryRoute && !isClockOutRoute && !isStartBreakRoute && !isEndBreakRoute && !isTimeOffRoute && !isReimburseRoute && !isSettingsRoute && !isNotificationsRoute && !isPrivacyRoute && !isHelpRoute && segments[0] !== 'edit-profile' && !isAllFeaturesRoute) {
      // Pengguna sudah login tapi tidak berada di grup (tabs) atau edit-profile,
      // arahkan ke halaman utama.
      console.log('Routing check - redirecting to /(tabs)');
      setHasRedirected(true);
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      // Pengguna belum login dan tidak berada di grup (auth),
      // arahkan ke halaman login.
      console.log('Routing check - redirecting to /(auth)/login');
      setHasRedirected(true);
      router.replace('/(auth)/login');
    } else {
      console.log('Routing check - no redirect needed');
    }
  }, [isAuthenticated, isLoading, segments, hasRedirected]);

  // Tampilkan splash screen selama data auth sedang dimuat
  if (isLoading) {
    return <SplashScreen />;
  }

  // Tampilkan halaman yang sesuai setelah loading selesai
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
