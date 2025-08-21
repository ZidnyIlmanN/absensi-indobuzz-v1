import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { realTimeStatusService, EmployeeStatusUpdate, StatusStatistics } from '@/services/realTimeStatusService';
import { Employee } from '@/types';

interface RealTimeStatusState {
  employees: Employee[];
  statistics: StatusStatistics | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionAttempts: number;
}

interface UseRealTimeEmployeeStatusOptions {
  autoConnect?: boolean;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  onStatusChange?: (employeeId: string, newStatus: 'online' | 'break' | 'offline') => void;
  onConnectionChange?: (isConnected: boolean) => void;
  enableDebugLogging?: boolean;
}

export function useRealTimeEmployeeStatus(options: UseRealTimeEmployeeStatusOptions = {}) {
  const {
    autoConnect = true,
    enableHeartbeat = true,
    heartbeatInterval = 30000,
    onStatusChange,
    onConnectionChange,
    enableDebugLogging = false,
  } = options;

  const [state, setState] = useState<RealTimeStatusState>({
    employees: [],
    statistics: null,
    isConnected: false,
    isLoading: true,
    error: null,
    lastUpdated: null,
    connectionAttempts: 0,
  });

  const stateRef = useRef(state);
  const optionsRef = useRef({ onStatusChange, onConnectionChange });

  // Update refs when state or options change
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    optionsRef.current = { onStatusChange, onConnectionChange };
  }, [onStatusChange, onConnectionChange]);

  const log = useCallback((message: string, data?: any) => {
    if (enableDebugLogging) {
      console.log(`[RealTimeStatus] ${message}`, data || '');
    }
  }, [enableDebugLogging]);

  /**
   * Handle status updates from real-time service
   */
  const handleStatusUpdate = useCallback((update: EmployeeStatusUpdate) => {
    log('Status update received', update);

    setState(prev => {
      const updatedEmployees = prev.employees.map(employee => {
        if (employee.id === update.employeeId) {
          const updatedEmployee = {
            ...employee,
            status: update.status,
            lastActivity: update.lastActivity,
            isConnected: true,
          };

          // Notify about status change
          if (employee.status !== update.status) {
            optionsRef.current.onStatusChange?.(update.employeeId, update.status);
          }

          return updatedEmployee;
        }
        return employee;
      });

      return {
        ...prev,
        employees: updatedEmployees,
        lastUpdated: new Date(),
      };
    });
  }, [log]);

  /**
   * Handle connection state changes
   */
  const handleConnectionChange = useCallback((isConnected: boolean) => {
    log('Connection state changed', { isConnected });

    setState(prev => ({
      ...prev,
      isConnected,
      error: isConnected ? null : prev.error,
    }));

    optionsRef.current.onConnectionChange?.(isConnected);
  }, [log]);

  /**
   * Handle connection errors
   */
  const handleConnectionError = useCallback((error: string) => {
    log('Connection error', { error });

    setState(prev => ({
      ...prev,
      isConnected: false,
      error,
      connectionAttempts: prev.connectionAttempts + 1,
    }));
  }, [log]);

  /**
   * Handle successful reconnection
   */
  const handleReconnect = useCallback(() => {
    log('Reconnection successful');

    setState(prev => ({
      ...prev,
      isConnected: true,
      error: null,
      connectionAttempts: 0,
    }));

    // Reload employee data after reconnection
    loadEmployeeStatuses();
  }, [log]);

  /**
   * Load initial employee statuses
   */
  const loadEmployeeStatuses = useCallback(async () => {
    log('Loading employee statuses');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { employees, error } = await realTimeStatusService.getAllEmployeeStatuses();

      if (error) {
        setState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        employees,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      log('Employee statuses loaded', { count: employees.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load employees';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, [log]);

  /**
   * Load status statistics
   */
  const loadStatistics = useCallback(async () => {
    try {
      const { stats, error } = await realTimeStatusService.getStatusStatistics();

      if (!error && stats) {
        setState(prev => ({ ...prev, statistics: stats }));
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, []);

  /**
   * Initialize real-time connection
   */
  const initializeConnection = useCallback(async () => {
    log('Initializing real-time connection');

    try {
      await realTimeStatusService.initialize({
        onStatusUpdate: handleStatusUpdate,
        onConnectionError: handleConnectionError,
        onReconnect: handleReconnect,
        enableHeartbeat,
        heartbeatInterval,
      });

      handleConnectionChange(true);
      
      // Load initial data
      await Promise.all([
        loadEmployeeStatuses(),
        loadStatistics(),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      handleConnectionError(errorMessage);
    }
  }, [
    handleStatusUpdate,
    handleConnectionError,
    handleReconnect,
    handleConnectionChange,
    loadEmployeeStatuses,
    loadStatistics,
    enableHeartbeat,
    heartbeatInterval,
    log,
  ]);

  /**
   * Manually refresh all data
   */
  const refreshData = useCallback(async () => {
    log('Manual data refresh triggered');

    await Promise.all([
      loadEmployeeStatuses(),
      loadStatistics(),
      realTimeStatusService.refreshStatusCache(),
    ]);
  }, [loadEmployeeStatuses, loadStatistics, log]);

  /**
   * Update employee status manually
   */
  const updateEmployeeStatus = useCallback(async (
    employeeId: string,
    status: 'online' | 'break' | 'offline',
    reason?: string
  ) => {
    log('Manual status update', { employeeId, status, reason });

    const result = await realTimeStatusService.updateEmployeeStatus(employeeId, status, reason);
    
    if (!result.success) {
      setState(prev => ({ ...prev, error: result.error || 'Status update failed' }));
    }

    return result;
  }, [log]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      log('App state changed', { nextAppState });

      if (nextAppState === 'active' && !state.isConnected) {
        log('App became active, attempting reconnection');
        initializeConnection();
      } else if (nextAppState === 'background') {
        log('App went to background');
        // Keep connection alive but reduce heartbeat frequency
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [state.isConnected, initializeConnection, log]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    if (autoConnect) {
      initializeConnection();
    }

    return () => {
      log('Cleaning up real-time status service');
      realTimeStatusService.cleanup();
    };
  }, [autoConnect, initializeConnection, log]);

  /**
   * Periodic statistics refresh
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isConnected) {
        loadStatistics();
      }
    }, 60000); // Refresh statistics every minute

    return () => clearInterval(interval);
  }, [state.isConnected, loadStatistics]);

  return {
    // State
    employees: state.employees,
    statistics: state.statistics,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    connectionAttempts: state.connectionAttempts,

    // Actions
    refreshData,
    updateEmployeeStatus,
    initializeConnection,

    // Connection info
    connectionStatus: realTimeStatusService.getConnectionStatus(),
  };
}