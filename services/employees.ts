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
          attendance_records (
            status,
            clock_in,
            date
          )
        `)
        .order('name');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees = data.map((profile: any) => this.mapEmployeeRecord(profile));
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

      const employees = data.map((profile: any) => this.mapEmployeeRecord(profile));
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

      const employees = data.map((profile: any) => this.mapEmployeeRecord(profile));
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

  // Subscribe to real-time employee updates
  subscribeToEmployeeUpdates(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  // Helper function to map separate profile and attendance data to Employee
  mapEmployeeRecordFromSeparateData(profile: any, attendance: any): Employee {
    let status: Employee['status'] = 'offline';
    
    if (attendance) {
      switch (attendance.status) {
        case 'working':
          status = 'online';
          break;
        case 'break':
          status = 'break';
          break;
        case 'completed':
          status = 'offline';
          break;
        default:
          status = 'offline';
      }
    }

    return {
      id: profile.id,
      name: profile.name,
      position: profile.position || '',
      department: profile.department || '',
      avatar: profile.avatar_url || '',
      status,
      workHours: profile.work_schedule || '09:00-18:00',
      location: profile.location || '',
      phone: profile.phone || '',
      email: profile.email,
      currentAttendance: attendance ? {
        id: attendance.id,
        userId: profile.id,
        clockIn: new Date(attendance.clock_in),
        clockOut: attendance.clock_out ? new Date(attendance.clock_out) : undefined,
        date: attendance.date,
        workHours: attendance.work_hours || 0,
        breakTime: attendance.break_time || 0,
        overtimeHours: attendance.overtime_hours || 0,
        clientVisitTime: attendance.client_visit_time || 0,
        status: attendance.status,
        location: {
          latitude: parseFloat(attendance.location_lat || '0'),
          longitude: parseFloat(attendance.location_lng || '0'),
          address: attendance.location_address || '',
        },
        selfieUrl: attendance.selfie_url,
        notes: attendance.notes,
        activities: [],
        breakStartTime: null,
      } : undefined,
    };
  },

  // Helper function to map database record to Employee
  mapEmployeeRecord(data: any): Employee {
    // Get today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = data.attendance_records?.find((record: any) => 
      record.date === today
    );
    
    // Get the most recent attendance record for status determination
    const recentAttendance = data.attendance_records?.[0];

    let status: Employee['status'] = 'offline';
    
    // Use today's attendance if available, otherwise use most recent
    const attendanceForStatus = todayAttendance || recentAttendance;
    
    if (attendanceForStatus) {
      switch (attendanceForStatus.status) {
        case 'working':
          status = 'online';
          break;
        case 'break':
          status = 'break';
          break;
        case 'completed':
          status = 'offline';
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
      currentAttendance: attendanceForStatus ? {
        id: attendanceForStatus.id,
        userId: data.id,
        clockIn: new Date(attendanceForStatus.clock_in),
        clockOut: attendanceForStatus.clock_out ? new Date(attendanceForStatus.clock_out) : undefined,
        date: attendanceForStatus.date,
        workHours: attendanceForStatus.work_hours || 0,
        breakTime: attendanceForStatus.break_time || 0,
        overtimeHours: attendanceForStatus.overtime_hours || 0,
        clientVisitTime: attendanceForStatus.client_visit_time || 0,
        status: attendanceForStatus.status,
        location: {
          latitude: parseFloat(attendanceForStatus.location_lat || '0'),
          longitude: parseFloat(attendanceForStatus.location_lng || '0'),
          address: attendanceForStatus.location_address || '',
        },
        selfieUrl: attendanceForStatus.selfie_url,
        notes: attendanceForStatus.notes,
        activities: [],
        breakStartTime: null,
      } : undefined,
    };
  },
};