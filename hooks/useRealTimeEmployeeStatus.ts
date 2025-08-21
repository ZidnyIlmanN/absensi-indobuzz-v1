import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { realTimeStatusService, EmployeeStatusUpdate, StatusStats, RealTimeStatusOptions } from '@/services/realTimeStatus';
import { Employee } from '@/types';

interface RealTimeEmployeeStatusState {
  employeeStatuses: Map<string, EmployeeStatusUpdate>;
  stats: StatusStats;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface UseRealTimeEmployeeStatusOptions {
  enableAutoReconnect?: boolean;
  enableDebugLogging?: boolean;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

export function useRealTimeEmployeeStatus(options: UseRealTimeEmployeeStatusOptions = {}) {
  const {
    enableAutoReconnect = true,
    enableDebugLogging = false,
    onConnectionChange,
    onError,
  } = options;

  const [state, setState] = useState<RealTimeEmployeeStatusState>({
    employeeStatuses: new Map(),
    stats: {
      totalEmployees: 0,
      onlineEmployees: 0,
      breakEmployees: 0,
      offlineEmployees: 0,
    },
    isConnected: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
  });

  const isInitialized = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  /**
   * Handle status updates from real-time service
   */
  const handleStatusUpdate = useCallback((update: EmployeeStatusUpdate) => {
    setState(prev => {
      const newStatuses = new Map(prev.employeeStatuses);
      newStatuses.set(update.employeeId, update);
      
      return {
        ...prev,
        employeeStatuses: newStatuses,
        lastUpdate: new Date(),
        error: null,
      };
    });
  }, []);

  /**
   * Handle stats updates from real-time service
   */
  const handleStatsUpdate = useCallback((stats: StatusStats) => {
    setState(prev => ({
      ...prev,
      stats,
      lastUpdate: new Date(),
    }));
  }, []);

  /**
   * Handle connection status changes
   */
  const handleConnectionChange = useCallback((connected: boolean) => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      error: connected ? null : prev.error,
    }));
    
    onConnectionChange?.(connected);
  }, [onConnectionChange]);

  /**
   * Handle errors from real-time service
   */
  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
    
    onError?.(error);
  }, [onError]);

  /**
   * Initialize real-time service
   */
  const initializeService = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const serviceOptions: RealTimeStatusOptions = {
        onStatusUpdate: handleStatusUpdate,
        onStatsUpdate: handleStatsUpdate,
        onConnectionChange: handleConnectionChange,
        onError: handleError,
        enableDebugLogging,
      };

      await realTimeStatusService.initialize(serviceOptions);
      
      // Load initial cached data
      const cachedStatuses = realTimeStatusService.getAllEmployeeStatuses();
      const cachedStats = realTimeStatusService.getCurrentStats();

      setState(prev => ({
        ...prev,
        employeeStatuses: cachedStatuses,
        stats: cachedStats || prev.stats,
        isLoading: false,
        lastUpdate: new Date(),
      }));

      isInitialized.current = true;
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to initialize real-time service');
    }
  }, [handleStatusUpdate, handleStatsUpdate, handleConnectionChange, handleError, enableDebugLogging]);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    appStateRef.current = nextAppState;

    if (nextAppState === 'active' && enableAutoReconnect) {
      // Reconnect when app becomes active
      if (!state.isConnected) {
        try {
          await realTimeStatusService.forceReconnect();
        } catch (error) {
          console.error('Failed to reconnect on app resume:', error);
        }
      }
    }
  }, [state.isConnected, enableAutoReconnect]);

  /**
   * Get employee status by ID
   */
  const getEmployeeStatus = useCallback((employeeId: string): EmployeeStatusUpdate | null => {
    return state.employeeStatuses.get(employeeId) || null;
  }, [state.employeeStatuses]);

  /**
   * Update employee list with real-time status
   */
  const updateEmployeesWithStatus = useCallback((employees: Employee[]): Employee[] => {
    return employees.map(employee => {
      const statusUpdate = state.employeeStatuses.get(employee.id);
      
      if (statusUpdate) {
        return {
          ...employee,
          status: statusUpdate.status,
        };
      }
      
      return employee;
    });
  }, [state.employeeStatuses]);

  /**
   * Manually refresh specific employee status
   */
  const refreshEmployeeStatus = useCallback(async (employeeId: string) => {
    try {
      await realTimeStatusService.refreshEmployeeStatus(employeeId);
    } catch (error) {
      console.error('Failed to refresh employee status:', error);
    }
  }, []);

  /**
   * Force reconnection
   */
  const forceReconnect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await realTimeStatusService.forceReconnect();
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Reconnection failed');
    }
  }, [handleError]);

  // Initialize service on mount
  useEffect(() => {
    initializeService();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      realTimeStatusService.cleanup();
      isInitialized.current = false;
    };
  }, [initializeService, handleAppStateChange]);

  return {
    // State
    employeeStatuses: state.employeeStatuses,
    stats: state.stats,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    
    // Actions
    getEmployeeStatus,
    updateEmployeesWithStatus,
    refreshEmployeeStatus,
    forceReconnect,
    
    // Connection info
    connectionStatus: realTimeStatusService.getConnectionStatus(),
  };
}