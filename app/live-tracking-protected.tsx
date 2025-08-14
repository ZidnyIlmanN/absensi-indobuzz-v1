import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import LiveTrackingScreen from './live-tracking';

export default function ProtectedLiveTrackingScreen() {
  return (
    <AuthGuard>
      <LiveTrackingScreen />
    </AuthGuard>
  );
}