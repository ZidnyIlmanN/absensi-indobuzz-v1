import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import StartBreakScreen from './index';

export default function ProtectedStartBreakScreen() {
  return (
    <AuthGuard>
      <StartBreakScreen />
    </AuthGuard>
  );
}
