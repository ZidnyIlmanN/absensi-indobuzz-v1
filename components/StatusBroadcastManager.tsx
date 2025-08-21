import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { realTimeStatusService } from '@/services/realTimeStatusService';

interface StatusBroadcastManagerProps {
  children: React.ReactNode;
}

/**
 * Component that manages real-time status broadcasting across the app
 * Should be placed high in the component tree (e.g., in _layout.tsx)
 */
export function StatusBroadcastManager({ children }: StatusBroadcastManagerProps) {
  const { user, isAuthenticated, currentAttendance, isWorking } = useAppContext();
  const isInitializedRef = useRef(false);
  const lastStatusRef = useRef<string | null>(null);

  // Initialize real-time status service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitializedRef.current) {
      console.log('Initializing status broadcast for user:', user.name);
      
      realTimeStatusService.initialize({
        enableHeartbeat: true,
        heartbeatInterval: 30000, // 30 seconds
        enableDebugLogging: __DEV__,
        onStatusUpdate: (update) => {
          console.log('Status update received:', update);
        },
        onConnectionChange: (connected) => {
          console.log('Connection status changed:', connected);
        },
        onError: (error) => {
          console.error('Real-time status error:', error);
        },
      }).then(() => {
        isInitializedRef.current = true;
        console.log('Status broadcast manager initialized');
      }).catch((error) => {
        console.error('Failed to initialize status broadcast:', error);
      });
    }

    // Cleanup when user logs out
    if (!isAuthenticated && isInitializedRef.current) {
      console.log('Cleaning up status broadcast');
      realTimeStatusService.cleanup();
      isInitializedRef.current = false;
      lastStatusRef.current = null;
    }
  }, [isAuthenticated, user]);

  // Update status based on attendance changes
  useEffect(() => {
    if (!isInitializedRef.current || !isAuthenticated) return;

    let newStatus: 'online' | 'break' | 'offline' | 'away';
    
    if (!currentAttendance) {
      newStatus = 'offline';
    } else if (currentAttendance.status === 'break') {
      newStatus = 'break';
    } else if (isWorking) {
      newStatus = 'online';
    } else {
      newStatus = 'offline';
    }

    // Only update if status actually changed
    if (lastStatusRef.current !== newStatus) {
      console.log(`Updating status from ${lastStatusRef.current} to ${newStatus}`);
      
      realTimeStatusService.updateStatus(newStatus, 'Automatic from attendance').then((result) => {
        if (result.success) {
          lastStatusRef.current = newStatus;
        } else {
          console.error('Failed to update status:', result.error);
        }
      });
    }
  }, [currentAttendance, isWorking, isAuthenticated]);

  // Handle app state changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isInitializedRef.current) return;

      if (nextAppState === 'background') {
        // Set status to away when app goes to background
        realTimeStatusService.updateStatus('away', 'App backgrounded');
      } else if (nextAppState === 'active') {
        // Restore previous status when app becomes active
        if (lastStatusRef.current && lastStatusRef.current !== 'away') {
          realTimeStatusService.updateStatus(lastStatusRef.current as any, 'App resumed');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        console.log('StatusBroadcastManager unmounting, cleaning up...');
        realTimeStatusService.cleanup();
      }
    };
  }, []);

  return <>{children}</>;
}