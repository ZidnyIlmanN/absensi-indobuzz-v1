import { useState, useEffect, useCallback } from 'react';
import { liveTrackingService, LiveTrackingData, OfficeLocation } from '@/services/liveTracking';
import { Employee } from '@/types';

interface LiveTrackingState {
  employees: (Employee & { liveLocation?: LiveTrackingData })[];
  officeLocations: OfficeLocation[];
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    onBreakEmployees: number;
    officeLocations: number;
  };
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseLiveTrackingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableRealTimeUpdates?: boolean;
}

export function useLiveTracking(options: UseLiveTrackingOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealTimeUpdates = true,
  } = options;

  const [trackingState, setTrackingState] = useState<LiveTrackingState>({
    employees: [],
    officeLocations: [],
    stats: {
      totalEmployees: 0,
      activeEmployees: 0,
      onBreakEmployees: 0,
      officeLocations: 0,
    },
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const loadEmployeeLocations = useCallback(async () => {
    try {
      console.log('Loading live employee locations...');
      const { employees, error } = await liveTrackingService.getLiveEmployeeLocations();
      
      if (error) {
        setTrackingState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      console.log(`Live tracking loaded ${employees.length} employees with locations`);
      console.log('Employee statuses:', employees.map(e => ({ 
        name: e.name, 
        status: e.status, 
        hasLiveLocation: !!e.liveLocation 
      })));
      
      setTrackingState(prev => ({
        ...prev,
        employees,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      setTrackingState(prev => ({
        ...prev,
        error: 'Failed to load employee locations',
        isLoading: false,
      }));
    }
  }, []);

  const loadOfficeLocations = useCallback(async () => {
    try {
      const { locations, error } = await liveTrackingService.getOfficeLocations();
      
      if (error) {
        console.error('Failed to load office locations:', error);
        return;
      }

      setTrackingState(prev => ({
        ...prev,
        officeLocations: locations,
      }));
    } catch (error) {
      console.error('Error loading office locations:', error);
    }
  }, []);

  const loadTrackingStats = useCallback(async () => {
    try {
      const { stats, error } = await liveTrackingService.getTrackingStats();
      
      if (error) {
        console.error('Failed to load tracking stats:', error);
        return;
      }

      setTrackingState(prev => ({
        ...prev,
        stats,
      }));
    } catch (error) {
      console.error('Error loading tracking stats:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setTrackingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await Promise.all([
        loadEmployeeLocations(),
        loadOfficeLocations(),
        loadTrackingStats(),
      ]);
    } catch (error) {
      setTrackingState(prev => ({
        ...prev,
        error: 'Failed to refresh tracking data',
      }));
    } finally {
      setTrackingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadEmployeeLocations, loadOfficeLocations, loadTrackingStats]);

  const updateEmployeeLocation = useCallback(async (
    userId: string,
    location: { latitude: number; longitude: number; address?: string }
  ) => {
    const { error } = await liveTrackingService.updateEmployeeLocation(userId, location);
    
    if (!error) {
      // Refresh employee locations after update
      await loadEmployeeLocations();
    }
    
    return { error };
  }, [loadEmployeeLocations]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadEmployeeLocations(); // Only refresh employee locations for real-time updates
        loadTrackingStats();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadEmployeeLocations, loadTrackingStats]);

  // Real-time updates setup
  useEffect(() => {
    if (enableRealTimeUpdates) {
      const unsubscribe = liveTrackingService.subscribeToLocationUpdates((data) => {
        setTrackingState(prev => {
        const updatedEmployees = prev.employees.map(emp => {
            if (emp.id === data.employeeId) {
            return {
                ...emp,
                liveLocation: data,
                status: data.status === 'working' ? 'online' : data.status === 'break' ? 'break' : 'offline' as 'break' | 'online' | 'offline',
            };
            }
            return emp;
        });

          return {
            ...prev,
            employees: updatedEmployees,
            lastUpdated: new Date(),
          };
        });
      });

      return unsubscribe;
    }
  }, [enableRealTimeUpdates]);

  return {
    ...trackingState,
    refreshData,
    updateEmployeeLocation,
  };
}