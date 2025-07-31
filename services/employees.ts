import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export const employeesService = {
  // Get all employees
  async getAllEmployees(): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          attendance_records!inner (
            status,
            clock_in,
            date
          )
        `)
        .eq('attendance_records.date', new Date().toISOString().split('T')[0])
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees = data.map(profile => this.mapEmployeeRecord(profile));
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
        .select(`
          *,
          attendance_records (
            status,
            clock_in,
            date
          )
        `)
        .eq('department', department)
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees = data.map(profile => this.mapEmployeeRecord(profile));
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
        .select(`
          *,
          attendance_records (
            status,
            clock_in,
            date
          )
        `)
        .or(`name.ilike.%${query}%,position.ilike.%${query}%,department.ilike.%${query}%,employee_id.ilike.%${query}%`)
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees = data.map(profile => this.mapEmployeeRecord(profile));
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
        .select(`
          *,
          attendance_records (
            status,
            clock_in,
            date
          )
        `)
        .eq('id', employeeId)
        .single();

      if (error) {
        return { employee: null, error: handleSupabaseError(error) };
      }

      return {
        employee: this.mapEmployeeRecord(data),
        error: null,
      };
    } catch (error) {
      return { employee: null, error: handleSupabaseError(error) };
    }
  },

  // Helper function to map database record to Employee
  mapEmployeeRecord(data: any): Employee {
    const todayAttendance = data.attendance_records?.find((record: any) => 
      record.date === new Date().toISOString().split('T')[0]
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
        id: todayAttendance.id,
        userId: data.id,
        clockIn: new Date(todayAttendance.clock_in),
        clockOut: todayAttendance.clock_out ? new Date(todayAttendance.clock_out) : undefined,
        date: todayAttendance.date,
        workHours: todayAttendance.work_hours || 0,
        breakTime: todayAttendance.break_time || 0,
        overtimeHours: todayAttendance.overtime_hours || 0,
        clientVisitTime: todayAttendance.client_visit_time || 0,
        status: todayAttendance.status,
        location: {
          latitude: parseFloat(todayAttendance.location_lat || '0'),
          longitude: parseFloat(todayAttendance.location_lng || '0'),
          address: todayAttendance.location_address || '',
        },
        selfieUrl: todayAttendance.selfie_url,
        notes: todayAttendance.notes,
        activities: [],
      } : undefined,
    };
  },
};