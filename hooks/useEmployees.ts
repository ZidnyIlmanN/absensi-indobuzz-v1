import { useState, useEffect, useCallback } from 'react';
import { employeesService } from '@/services/employees';
import { Employee } from '@/types';

interface EmployeesState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}

export function useEmployees() {
  const [employeesState, setEmployeesState] = useState<EmployeesState>({
    employees: [],
    isLoading: true,
    error: null,
  });

  const loadEmployees = useCallback(async () => {
    setEmployeesState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { employees, error } = await employeesService.getAllEmployees();
      
      if (error) {
        setEmployeesState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setEmployeesState(prev => ({
        ...prev,
        employees,
        isLoading: false,
      }));
    } catch (error) {
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to load employees data',
        isLoading: false,
      }));
    }
  }, []);

  const searchEmployees = useCallback(async (query: string) => {
    setEmployeesState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { employees, error } = await employeesService.searchEmployees(query);
      
      if (error) {
        setEmployeesState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setEmployeesState(prev => ({
        ...prev,
        employees,
        isLoading: false,
      }));
    } catch (error) {
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to search employees',
        isLoading: false,
      }));
    }
  }, []);

  const refreshEmployees = useCallback(async () => {
    await loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    ...employeesState,
    searchEmployees,
    refreshEmployees,
  };
}
