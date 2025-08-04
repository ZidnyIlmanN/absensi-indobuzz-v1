import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export const employeesService = {
  // Get all employees
  async getAllEmployees(): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      // First, get all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) {
        return { employees: [], error: handleSupabaseError(profilesError) };
      }

      // Then get attendance records for each profile
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles!inner (
            id,
            name,
            email,
            phone,
            position,
            department,
            avatar_url,
            employee_id,
            location,
            work_schedule
          )
        `)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('No attendance records for today, showing all employees as offline');
      }

      // Create a map of employees with their attendance data
      const employeeMap = new Map();
      
      // Add all profiles first (ensures all employees are shown)
      allProfiles.forEach(profile => {
        employeeMap.set(profile.id, {
          profile,
          attendance: null
        });
      });
      
      // Add attendance data where available
      if (data && !error) {
        data.forEach((attendance: any) => {
          if (employeeMap.has(attendance.user_id)) {
            employeeMap.set(attendance.user_id, {
              profile: attendance.profiles,
              attendance: attendance
            });
          }
        });
      }
      
      // Convert map to employee objects
      const employees = Array.from(employeeMap.values()).map((item: any) => 
        this.mapEmployeeRecordFromSeparateData(item.profile, item.attendance)
      );
      
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
        employee: this.mapEmployeeRecordFromSeparateData(profile, data),
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
        breakStartTime: null,
      } : undefined,
    };
  },
};