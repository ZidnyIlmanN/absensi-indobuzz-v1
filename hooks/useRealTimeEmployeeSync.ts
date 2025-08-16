import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeSyncService, StatusUpdate } from '@/services/realTimeSync';
import { Employee } from '@/types';
import { employeesService } from '@/services/employees';

interface RealTimeEmployeeSyncState {
  employees: Employee[];
  lastUpdate: Date | null;
  syncStatus: 'connected' | 'disconnected' | 'error';
  error: string | null;
}

interface UseRealTimeEmployeeSyncOptions {
  enableDebugLogging?: boolean;
  autoReconnect?: boolean;
  onStatusChange?: (employeeId: string, newStatus: Employee['status']) => void;
}

export function useRealTimeEmployeeSync(
  initialEmployees: Employee[] = [],
  options: UseRealTimeEmployeeSyncOptions = {}
) {
  const [syncState, setSyncState] = useState<RealTimeEmployeeSyncState>({
    employees: initialEmployees,
    lastUpdate: null,
    syncStatus: 'disconnected',
    error: null,
  });

  const employeesRef = useRef<Employee[]>(initialEmployees);
  const { enableDebugLogging = false, autoReconnect = true, onStatusChange } = options;

  // Update ref when employees change
  useEffect(() => {
    employeesRef.current = syncState.employees;
  }, [syncState.employees]);

  const handleStatusUpdate = useCallback((statusUpdate: StatusUpdate) => {
    if (enableDebugLogging) {
      console.log('Real-time status update received:', statusUpdate);
    }

    setSyncState(prev => {
      const updatedEmployees = prev.employees.map(employee => {
        if (employee.id === statusUpdate.employeeId) {
          const updatedEmployee = {
            ...employee,
            status: statusUpdate.status,
          };
          
          // Trigger callback for external handling
          onStatusChange?.(employee.id, statusUpdate.status);
          
          return updatedEmployee;
        }
        return employee;
      });

      return {
        ...prev,
        employees: updatedEmployees,
        lastUpdate: statusUpdate.timestamp,
        syncStatus: 'connected',
        error: null,
      };
    });
  }, [enableDebugLogging, onStatusChange]);

  const handleEmployeeUpdate = useCallback((updatedEmployee: Employee) => {
    if (enableDebugLogging) {
      console.log('Real-time employee update received:', updatedEmployee);
    }

    setSyncState(prev => {
      const updatedEmployees = prev.employees.map(employee => {
        if (employee.id === updatedEmployee.id) {
          return { ...employee, ...updatedEmployee };
        }
        return employee;
      });

      return {
        ...prev,
        employees: updatedEmployees,
        lastUpdate: new Date(),
        syncStatus: 'connected',
        error: null,
      };
    });
  }, [enableDebugLogging]);

  const handleSyncError = useCallback((error: string) => {
    console.error('Real-time sync error:', error);
    
    setSyncState(prev => ({
      ...prev,
      syncStatus: 'error',
      error,
    }));

    // Auto-reconnect if enabled
    if (autoReconnect) {
      setTimeout(() => {
        initializeSync();
      }, 5000); // Retry after 5 seconds
    }
  }, [autoReconnect]);

  const initializeSync = useCallback(async () => {
    try {
      setSyncState(prev => ({ ...prev, syncStatus: 'disconnected', error: null }));
      
      await realTimeSyncService.initialize({
        onStatusUpdate: handleStatusUpdate,
        onEmployeeUpdate: handleEmployeeUpdate,
        onError: handleSyncError,
        enableDebugLogging,
      });

      setSyncState(prev => ({ ...prev, syncStatus: 'connected' }));
    } catch (error) {
      handleSyncError(error instanceof Error ? error.message : 'Sync initialization failed');
    }
  }, [handleStatusUpdate, handleEmployeeUpdate, handleSyncError, enableDebugLogging]);

  const updateEmployees = useCallback((newEmployees: Employee[]) => {
    setSyncState(prev => ({
      ...prev,
      employees: newEmployees,
      lastUpdate: new Date(),
    }));
  }, []);

  const triggerManualSync = useCallback(async (employeeId?: string) => {
    if (employeeId) {
      const result = await realTimeSyncService.triggerStatusSync(employeeId);
      if (!result.success) {
        handleSyncError(result.error || 'Manual sync failed');
      }
    } else {
      // Refresh all employee data
      try {
        const { employees, error } = await employeesService.getAllEmployees();
        if (error) {
          handleSyncError(error);
        } else {
          updateEmployees(employees);
        }
      } catch (error) {
        handleSyncError(error instanceof Error ? error.message : 'Failed to refresh employees');
      }
    }
  }, [handleSyncError, updateEmployees]);

  const getSyncDiagnostics = useCallback(() => {
    const syncStatus = realTimeSyncService.getSyncStatus();
    return {
      ...syncStatus,
      currentEmployeeCount: syncState.employees.length,
      lastUpdate: syncState.lastUpdate,
      connectionStatus: syncState.syncStatus,
      hasError: !!syncState.error,
      error: syncState.error,
    };
  }, [syncState]);

  // Initialize on mount
  useEffect(() => {
    initializeSync();

    return () => {
      realTimeSyncService.cleanup();
    };
  }, [initializeSync]);

  // Update employees when initial data changes
  useEffect(() => {
    if (initialEmployees.length > 0 && syncState.employees.length === 0) {
      updateEmployees(initialEmployees);
    }
  }, [initialEmployees, syncState.employees.length, updateEmployees]);

  return {
    employees: syncState.employees,
    syncStatus: syncState.syncStatus,
    lastUpdate: syncState.lastUpdate,
    error: syncState.error,
    updateEmployees,
    triggerManualSync,
    getSyncDiagnostics,
    reinitializeSync: initializeSync,
  };
}