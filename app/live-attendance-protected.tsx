import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import LiveAttendanceScreen from './live-attendance';

export default function ProtectedLiveAttendance() {
  return (
    <AuthGuard>
      <LiveAttendanceScreen />
    </AuthGuard>
  );
}
