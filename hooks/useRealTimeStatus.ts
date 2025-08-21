import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  realTimeStatusService, 
  EmployeeStatus, 
  StatusStatistics, 
  StatusUpdate,
  RealTimeStatusOptions 
} from '@/services/realTimeStatusService';
import { AppState, AppStateStatus } from 'react-native';

interface RealTimeStatusState {
  employees: EmployeeStatus[];
  statistics: StatusStatistics | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface UseRealTimeStatusOptions extends Omit<RealTimeStatusOptions, 'onStatusUpdate' | 'onStatisticsUpdate' | 'onConnectionChange'> {
  autoInitialize?: boolean;
  enableAppStateHandling?: boolean;
}

export function useRealTimeStatus(options: UseRealTimeStatusOptions = {}) {
  const {
    autoInitialize = true,
    enableAppStateHandling = true,
    enableHeartbeat = true,
    heartbeatInterval = 30000,
    enableDebugLogging = false,
    onError,
  } = options;

  const [state, setState] = useState<RealTimeStatusState>({
    employees: [],
    statistics: null,
    isConnected: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
  });

  const serviceRef = useRef(realTimeStatusService);
  const isInitializedRef = useRef(false);

  // Handle status updates
  const handleStatusUpdate = useCallback((update: StatusUpdate) => {
    setState(prev => {
      const updatedEmployees = prev.employees.map(emp => {
        if (emp.employeeId === update.employeeId) {
          return {
            ...emp,
            currentStatus: update.newStatus as any,
            lastActivity: new Date(update.timestamp),
            minutesInStatus: 0, // Reset counter for new status
          };
        }
        return emp;
      });

      // If employee not found, this might be a new employee
      if (!updatedEmployees.find(emp => emp.employeeId === update.employeeId)) {
        // Trigger a full refresh to get the new employee
        refreshTeamStatus();
      }

      return {
        ...prev,
        employees: updatedEmployees,
        lastUpdate: new Date(),
      };
    });
  }, []);

  // Handle statistics updates
  const handleStatisticsUpdate = useCallback((statistics: StatusStatistics) => {
    setState(prev => ({
      ...prev,
      statistics,
      lastUpdate: new Date(),
    }));
  }, []);

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      error: connected ? null : prev.error,
    }));
  }, []);

  // Handle errors
  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
    onError?.(error);
  }, [onError]);

  // Initialize service
  const initializeService = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('Service already initialized, skipping');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await serviceRef.current.initialize({
        onStatusUpdate: handleStatusUpdate,
        onStatisticsUpdate: handleStatisticsUpdate,
        onConnectionChange: handleConnectionChange,
        onError: handleError,
        enableHeartbeat,
        heartbeatInterval,
        enableDebugLogging,
      });

      // Load initial data
      await refreshTeamStatus();
      await refreshStatistics();

      isInitializedRef.current = true;
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [
    handleStatusUpdate,
    handleStatisticsUpdate,
    handleConnectionChange,
    handleError,
    enableHeartbeat,
    heartbeatInterval,
    enableDebugLogging,
  ]);

  // Refresh team status
  const refreshTeamStatus = useCallback(async () => {
    try {
      const { employees, error } = await serviceRef.current.getTeamStatus();
      
      if (error) {
        setState(prev => ({ ...prev, error }));
        return;
      }

      setState(prev => ({
        ...prev,
        employees,
        lastUpdate: new Date(),
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh team status';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Refresh statistics
  const refreshStatistics = useCallback(async () => {
    try {
      const { statistics, error } = await serviceRef.current.getStatistics();
      
      if (error) {
        console.error('Failed to refresh statistics:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        statistics,
        lastUpdate: new Date(),
      }));
    } catch (error) {
      console.error('Error refreshing statistics:', error);
    }
  }, []);

  // Update current user status
  const updateMyStatus = useCallback(async (
    status: 'online' | 'break' | 'offline' | 'away',
    reason?: string
  ) => {
    try {
      const result = await serviceRef.current.updateStatus(status, reason);
      
      if (!result.success) {
        setState(prev => ({ ...prev, error: result.error || 'Status update failed' }));
        return false;
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Status update failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  // Force refresh all data
  const forceRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await serviceRef.current.forceRefresh();
      await Promise.all([
        refreshTeamStatus(),
        refreshStatistics(),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force refresh failed';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshTeamStatus, refreshStatistics]);

  // Handle app state changes
  useEffect(() => {
    if (!enableAppStateHandling) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isInitializedRef.current) {
        // Refresh data when app becomes active
        refreshTeamStatus();
        refreshStatistics();
      } else if (nextAppState === 'background') {
        // Update status to away when app goes to background
        updateMyStatus('away', 'App backgrounded');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [enableAppStateHandling, refreshTeamStatus, refreshStatistics, updateMyStatus]);

  // Initialize service on mount
  useEffect(() => {
    if (autoInitialize && !isInitializedRef.current) {
      initializeService();
    }

    // Cleanup on unmount
    return () => {
      if (isInitializedRef.current) {
        serviceRef.current.cleanup();
        isInitializedRef.current = false;
      }
    };
  }, [autoInitialize, initializeService]);

  return {
    // State
    ...state,
    
    // Actions
    updateMyStatus,
    refreshTeamStatus,
    refreshStatistics,
    forceRefresh,
    initializeService,
    
    // Service info
    connectionStatus: serviceRef.current.getConnectionStatus(),
  };
}