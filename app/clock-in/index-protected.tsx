import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import ClockInLandingScreen from './index';

export default function ProtectedClockInLandingScreen() {
  return (
    <AuthGuard>
      <ClockInLandingScreen />
    </AuthGuard>
  );
}
