import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import LiveTrackingScreen from './live-tracking';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ProtectedLiveTrackingScreen() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <LiveTrackingScreen />
      </AuthGuard>
    </ErrorBoundary>
  );
}