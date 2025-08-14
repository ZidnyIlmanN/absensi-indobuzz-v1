import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types';
import { employeesService } from '@/services/employees';
import { getCurrentLocation, OFFICE_COORDINATES } from '@/utils/location';

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  employeeCount?: number;
}

interface LiveTrackingState {
  employees: Employee[];
  officeLocations: OfficeLocation[];
  currentLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseLiveTrackingOptions {
  enableRealTimeTracking?: boolean;
  trackingInterval?: number; // in milliseconds
}

export function useLiveTracking(options: UseLiveTrackingOptions = {}) {
  const {
    enableRealTimeTracking = false,
    trackingInterval = 10000, // 10 seconds default
  } = options;

  const [trackingState, setTrackingState] = useState<LiveTrackingState>({
    employees: [],
    officeLocations: [],
    currentLocation: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // Mock office locations for PT. Indobuzz Republik Digital
  const mockOfficeLocations: OfficeLocation[] = [
    {
      id: 'main-office',
      name: 'Main Office',
      address: 'PT. INDOBUZZ REPUBLIK DIGITAL',
      coordinates: OFFICE_COORDINATES,
      employeeCount: 0,
    },
    {
      id: 'branch-office-1',
      name: 'Branch Office Jakarta',
      address: 'Jakarta Branch - PT. INDOBUZZ REPUBLIK DIGITAL',
      coordinates: {
        latitude: -6.2088,
        longitude: 106.8456,
      },
      employeeCount: 0,
    },
    {
      id: 'branch-office-2',
      name: 'Branch Office Bandung',
      address: 'Bandung Branch - PT. INDOBUZZ REPUBLIK DIGITAL',
      coordinates: {
        latitude: -6.9175,
        longitude: 107.6191,
      },
      employeeCount: 0,
    },
  ];

  const loadEmployeesWithLocations = useCallback(async () => {
    try {
      const { employees, error } = await employeesService.getAllEmployees({
        includeInactive: false,
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 100,
      });

      if (error) {
        setTrackingState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      // Mock current locations for employees (in real app, this would come from GPS tracking)
      const employeesWithLocations = employees.map(employee => ({
        ...employee,
        currentLocation: employee.status === 'online' || employee.status === 'break' ? {
          latitude: OFFICE_COORDINATES.latitude + (Math.random() - 0.5) * 0.002,
          longitude: OFFICE_COORDINATES.longitude + (Math.random() - 0.5) * 0.002,
        } : undefined,
      }));

      // Update office employee counts
      const updatedOfficeLocations = mockOfficeLocations.map(office => ({
        ...office,
        employeeCount: employeesWithLocations.filter(emp => 
          emp.currentLocation && emp.status === 'online'
        ).length,
      }));

      setTrackingState(prev => ({
        ...prev,
        employees: employeesWithLocations,
        officeLocations: updatedOfficeLocations,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error loading employees with locations:', error);
      setTrackingState(prev => ({
        ...prev,
        error: 'Failed to load employee locations',
        isLoading: false,
      }));
    }
  }, []);

  const loadCurrentLocation = useCallback(async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setTrackingState(prev => ({
          ...prev,
          currentLocation: location,
        }));
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setTrackingState(prev => ({ ...prev, isLoading: true, error: null }));
    await Promise.all([
      loadEmployeesWithLocations(),
      loadCurrentLocation(),
    ]);
  }, [loadEmployeesWithLocations, loadCurrentLocation]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time tracking
  useEffect(() => {
    if (!enableRealTimeTracking) return;

    const interval = setInterval(() => {
      loadEmployeesWithLocations();
    }, trackingInterval);

    return () => clearInterval(interval);
  }, [enableRealTimeTracking, trackingInterval, loadEmployeesWithLocations]);

  return {
    ...trackingState,
    refreshData,
  };
}