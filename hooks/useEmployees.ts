import { useState, useEffect, useCallback } from 'react';
import { employeesService } from '@/services/employees';
import { Employee } from '@/types';

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
  }, []);

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
    // Reload employees with new sort options
    loadEmployees();
  }, [loadEmployees]);

  const filterEmployees = useCallback((filterOptions: {
    department?: string;
    status?: Employee['status'];
    isActive?: boolean;
  }) => {
    const { department, status, isActive } = filterOptions;
    
    let filtered = [...employeesState.employees];
    
    if (department) {
      filtered = filtered.filter(emp => 
        emp.department.toLowerCase().includes(department.toLowerCase())
      );
    }
    
    if (status) {
      filtered = filtered.filter(emp => emp.status === status);
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

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    ...employeesState,
    searchEmployees,
    refreshEmployees,
    setSortOptions,
    filterEmployees,
    clearSearch,
  };
}
