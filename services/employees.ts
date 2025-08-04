import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export const employeesService = {
  // Get all employees
  async getAllEmployees(): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      // Get all profiles first
      const today = new Date().toISOString().split('T')[0];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) {
        return { employees: [], error: handleSupabaseError(profilesError) };
      }

      // Get today's attendance records for all users
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', today);

      if (attendanceError) {
        console.warn('Failed to fetch attendance records:', attendanceError);
      }

      // Map profiles to employees with their attendance data
      const employees = profiles.map((profile: any) => {
        // Find today's attendance record for this user
        const todayAttendance = attendanceRecords?.find((record: any) => 
          record.user_id === profile.id
        );
        
        return this.mapEmployeeRecord(profile, todayAttendance);
      });
      
      return { employees, error: null };
    } catch (error) {
      return { employees: [], error: handleSupabaseError(error) };
    }
  },

  // Helper function to map profile with optional attendance to Employee
  mapEmployeeRecord(profile: any, todayAttendance?: any): Employee {
    let status: Employee['status'] = 'offline';
    
    if (todayAttendance) {
      switch (todayAttendance.status) {
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
      currentAttendance: todayAttendance ? {
        id: todayAttendance.id,
        userId: profile.id,
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
        breakStartTime: null,
      } : undefined,
    };
  },

  // Add a new helper function for the separate data mapping (keeping for backward compatibility)
  mapEmployeeRecordFromSeparateData(profile: any, attendance: any): Employee {
    return this.mapEmployeeRecord(profile, attendance);
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
      // Get the profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (profileError) {
        return { employee: null, error: handleSupabaseError(profileError) };
      }

      // Get today's attendance record
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', employeeId)
        .eq('date', today)
        .single();

      if (error) {
        console.log('No attendance record found for today');
      }

      return {
        employee: this.mapEmployeeRecord(profile, data),
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
};