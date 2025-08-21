import { Employee as EmployeeType } from '@/types';

export interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
  sortBy: 'name' | 'department' | 'position' | 'employee_id';
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'name' | 'department' | 'position' | 'employee_id') => void;
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
  selectedDepartment: string;
  setSelectedDepartment: (value: string) => void;
  selectedStatus: EmployeeType['status'] | '';
  setSelectedStatus: (value: EmployeeType['status'] | '') => void;
  selectedPosition: string;
  setSelectedPosition: (value: string) => void;
  departments: string[];
  positions: string[];
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
  handleFilter: () => void;
  clearFilters: () => void;
}

export interface DepartmentFilter {
  department: string;
}

export interface PositionFilter {
  position: string;
}

export interface StatusFilter {
  status: EmployeeType['status'];
}
