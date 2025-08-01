import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export const employeesService = {
  // Get all employees
  async getAllEmployees(): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      // Get today's attendance for all employees
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('user_id, status, clock_in')
        .eq('date', today);

      const employees = data.map(profile => this.mapEmployeeRecord(profile, attendanceData));
      return { employees, error: null };
    } catch (error) {
      return { employees: [], error: handleSupabaseError(error) };
    }
  },

  // Get employees by department
  async getEmployeesByDepartment(department: string): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', department)
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('user_id, status, clock_in')
        .eq('date', today);

      const employees = data.map(profile => this.mapEmployeeRecord(profile, attendanceData));
      return { employees, error: null };
    } catch (error) {
      return { employees: [], error: handleSupabaseError(error) };
    }
  },

  // Search employees
  async searchEmployees(query: string): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${query}%,position.ilike.%${query}%,department.ilike.%${query}%,employee_id.ilike.%${query}%`)
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('user_id, status, clock_in')
        .eq('date', today);

      const employees = data.map(profile => this.mapEmployeeRecord(profile, attendanceData));
      return { employees, error: null };
    } catch (error) {
      return { employees: [], error: handleSupabaseError(error) };
    }
  },

  // Get employee by ID
  async getEmployeeById(employeeId: string): Promise<{ employee: Employee | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        return { employee: null, error: handleSupabaseError(error) };
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('user_id, status, clock_in')
        .eq('date', today)
        .eq('user_id', employeeId);
      return {
        employee: this.mapEmployeeRecord(data, attendanceData),
        error: null,
      };
    } catch (error) {
      return { employee: null, error: handleSupabaseError(error) };
    }
  },

  // Helper function to map database record to Employee
  mapEmployeeRecord(data: any, attendanceData?: any[]): Employee {
    const todayAttendance = attendanceData?.find((record: any) => 
      record.user_id === data.id
    );

    let status: Employee['status'] = 'offline';
    if (todayAttendance) {
      switch (todayAttendance.status) {
        case 'working':
          status = 'online';
          break;
        case 'break':
          status = 'break';
          break;
        default:
          status = 'offline';
      }
    }

    return {
      id: data.id,
      name: data.name,
      position: data.position || '',
      department: data.department || '',
      avatar: data.avatar_url || '',
      status,
      workHours: data.work_schedule || '09:00-18:00',
      location: data.location || '',
      phone: data.phone || '',
      email: data.email,
      currentAttendance: todayAttendance ? {
        id: 'temp-id',
        userId: data.id,
        clockIn: new Date(todayAttendance.clock_in),
        date: new Date().toISOString().split('T')[0],
        workHours: 0,
        breakTime: 0,
        overtimeHours: 0,
        clientVisitTime: 0,
        status: todayAttendance.status,
        location: {
          latitude: -6.2088,
          longitude: 106.8456,
          address: 'Jakarta Office',
        },
        activities: [],
      } : undefined,
    };
  },
};