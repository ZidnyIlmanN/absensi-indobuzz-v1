import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export const employeesService = {
  // Get all employees
  async getAllEmployees(options?: {
    includeInactive?: boolean;
    sortBy?: 'name' | 'department' | 'position' | 'employee_id';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      const { 
        includeInactive = true, 
        sortBy = 'name', 
        sortOrder = 'asc',
        limit = 1000 // Default high limit to get all employees
      } = options || {};
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get profiles with proper sorting and optional limit
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit);

      if (profilesError) {
        return { employees: [], error: handleSupabaseError(profilesError) };
      }

      // Get today's attendance records for the fetched users
      const userIds = profiles.map(profile => profile.id);
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', today)
        .in('user_id', userIds);

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
      
      console.log(`Loaded ${employees.length} employees from database`);
      return { employees, error: null };
    } catch (error) {
      console.error('Error loading all employees:', error);
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
      employeeId: profile.employee_id,
      position: profile.position || '',
      department: profile.department || '',
      avatar: profile.avatar_url || '',
      status,
      workHours: profile.work_schedule || '09:00-18:00',
      location: profile.location || '',
      phone: profile.phone || '',
      email: profile.email,
      joinDate: profile.join_date,
      isActive: true, // Assume all profiles in database are active
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
  async searchEmployees(
    query: string,
    options?: {
      searchFields?: ('name' | 'position' | 'department' | 'employee_id' | 'email')[];
      includeInactive?: boolean;
      limit?: number;
    }
  ): Promise<{ employees: Employee[]; error: string | null }> {
    try {
      const { 
        searchFields = ['name', 'position', 'department', 'employee_id', 'email'],
        includeInactive = true,
        limit = 100 // Reasonable limit for search results
      } = options || {};
      
      // Build search conditions for multiple fields
      const searchConditions = searchFields.map(field => `${field}.ilike.%${query}%`).join(',');
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(searchConditions)
        .order('name')
        .limit(limit);

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      // Get today's attendance for search results
      const userIds = data.map(profile => profile.id);
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', today)
        .in('user_id', userIds);

      const employees = data.map((profile: any) => {
        const todayAttendance = attendanceRecords?.find((record: any) => 
          record.user_id === profile.id
        );
        return this.mapEmployeeRecord(profile, todayAttendance);
      });
      
      console.log(`Search for "${query}" returned ${employees.length} employees`);
      return { employees, error: null };
    } catch (error) {
      console.error('Error searching employees:', error);
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