import { useState, useEffect, useCallback } from 'react';
import { employeesService } from '@/services/employees';
import { Employee } from '@/types';
import { realTimeSyncService } from '@/services/realTimeSync';

interface EmployeesState {
  employees: Employee[];
  filteredEmployees: Employee[];
  totalCount: number;
  activeCount: number;
  searchQuery: string;
  sortBy: 'name' | 'department' | 'position' | 'employee_id';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

export function useEmployees() {
  const [employeesState, setEmployeesState] = useState<EmployeesState>({
    employees: [],
    filteredEmployees: [],
    totalCount: 0,
    activeCount: 0,
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
    isLoading: true,
    error: null,
  });

  const loadEmployees = useCallback(async () => {
    setEmployeesState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { employees, error } = await employeesService.getAllEmployees({
        includeInactive: true,
        sortBy: employeesState.sortBy,
        sortOrder: employeesState.sortOrder,
        limit: 1000, // Get all employees
      });
      
      if (error) {
        setEmployeesState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      const activeCount = employees.filter(emp => emp.isActive).length;
      
      setEmployeesState(prev => ({
        ...prev,
        employees,
        filteredEmployees: employees,
        totalCount: employees.length,
        activeCount,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error in loadEmployees:', error);
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to load employees data',
        isLoading: false,
      }));
    }
  }, [employeesState.sortBy, employeesState.sortOrder]);

  const searchEmployees = useCallback(async (query: string) => {
    setEmployeesState(prev => ({ ...prev, searchQuery: query, isLoading: true, error: null }));

    if (!query.trim()) {
      // If empty query, show all employees
      setEmployeesState(prev => ({
        ...prev,
        filteredEmployees: prev.employees,
        isLoading: false,
      }));
      return;
    }

    try {
      const { employees, error } = await employeesService.searchEmployees(query, {
        searchFields: ['name', 'position', 'department', 'employee_id', 'email'],
        includeInactive: true,
        limit: 200, // Higher limit for search results
      });
      
      if (error) {
        setEmployeesState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setEmployeesState(prev => ({
        ...prev,
        filteredEmployees: employees,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error in searchEmployees:', error);
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to search employees',
        isLoading: false,
      }));
    }
  }, []);

  const setSortOptions = useCallback((sortBy: typeof employeesState.sortBy, sortOrder: typeof employeesState.sortOrder) => {
    setEmployeesState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // Separate effect to reload when sort options change
  useEffect(() => {
    if (employeesState.sortBy && employeesState.sortOrder) {
      loadEmployees();
    }
  }, [employeesState.sortBy, employeesState.sortOrder, loadEmployees]);

  const filterEmployees = useCallback((filterOptions: {
    department?: string;
    status?: Employee['status'];
    isActive?: boolean;
    position?: string;
  }) => {
    const { department, status, isActive, position } = filterOptions;
    
    let filtered = [...employeesState.employees];
    
    if (department) {
      filtered = filtered.filter(emp => 
        emp.department.toLowerCase().includes(department.toLowerCase())
      );
    }
    
    if (status) {
      filtered = filtered.filter(emp => emp.status === status);
    }
    
    if (position) {
      filtered = filtered.filter(emp => 
        emp.position.toLowerCase().includes(position.toLowerCase())
      );
    }
    
    if (isActive !== undefined) {
      filtered = filtered.filter(emp => emp.isActive === isActive);
    }
    
    setEmployeesState(prev => ({
      ...prev,
      filteredEmployees: filtered,
    }));
  }, [employeesState.employees]);

  const refreshEmployees = useCallback(async () => {
    await loadEmployees();
  }, [loadEmployees]);

  const clearSearch = useCallback(() => {
    setEmployeesState(prev => ({
      ...prev,
      searchQuery: '',
      filteredEmployees: prev.employees,
    }));
  }, []);

  // Real-time status update handler
  const handleRealTimeStatusUpdate = useCallback((event: any) => {
    const statusUpdate = event.detail;
    
    if (enableDebugLogging) {
      console.log('Received real-time status update in useEmployees:', statusUpdate);
    }
    
    setEmployeesState(prev => {
      const updatedEmployees = prev.employees.map(employee => {
        if (employee.id === statusUpdate.employeeId) {
          return {
            ...employee,
            status: statusUpdate.status,
          };
        }
        return employee;
      });
      
      const updatedFiltered = prev.filteredEmployees.map(employee => {
        if (employee.id === statusUpdate.employeeId) {
          return {
            ...employee,
            status: statusUpdate.status,
          };
        }
        return employee;
      });

      return {
        ...prev,
        employees: updatedEmployees,
        filteredEmployees: updatedFiltered,
      };
    });
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    // Listen for custom status update events
    if (typeof window !== 'undefined') {
      window.addEventListener('employeeStatusUpdate', handleRealTimeStatusUpdate);
    }

    // Initialize real-time sync service
    realTimeSyncService.initialize({
      enableDebugLogging: __DEV__,
      onStatusUpdate: (statusUpdate) => {
        // This will also trigger the custom event
        handleRealTimeStatusUpdate({ detail: statusUpdate });
      },
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('employeeStatusUpdate', handleRealTimeStatusUpdate);
      }
    };
  }, [handleRealTimeStatusUpdate]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Update employees from sync service
  const updateEmployeesFromSync = useCallback((newEmployees: Employee[]) => {
    setEmployeesState(prev => ({
      ...prev,
      employees: newEmployees,
      filteredEmployees: newEmployees, // Reset filters when updating
    }));
  }, []);

  return {
    ...employeesState,
    syncStatus,
    lastSyncUpdate: syncState.lastUpdate,
    syncError: syncState.error,
    searchEmployees,
    refreshEmployees,
    setSortOptions,
    filterEmployees,
    clearSearch,
    updateEmployeesFromSync,
    triggerManualSync: () => triggerManualSync(),
  };
}