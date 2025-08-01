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

      setEmployeesState({
        employees,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to load employees',
        isLoading: false,
      }));
    }
  }, []);

  const searchEmployees = async (query: string) => {
    if (!query.trim()) {
      await loadEmployees();
      return;
    }

    setEmployeesState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { employees, error } = await employeesService.searchEmployees(query);
      
      if (error) {
        setEmployeesState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setEmployeesState({
        employees,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to search employees',
        isLoading: false,
      }));
    }
  };

  const getEmployeesByDepartment = async (department: string) => {
    setEmployeesState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { employees, error } = await employeesService.getEmployeesByDepartment(department);
      
      if (error) {
        setEmployeesState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setEmployeesState({
        employees,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setEmployeesState(prev => ({
        ...prev,
        error: 'Failed to load employees by department',
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    ...employeesState,
    searchEmployees,
    getEmployeesByDepartment,
    refreshEmployees: loadEmployees,
  };
}