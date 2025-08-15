import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export interface LiveTrackingData {
  employeeId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: Date;
  accuracy?: number;
  status: 'working' | 'break' | 'offline';
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  activeEmployees: number;
}

export const liveTrackingService = {
  /**
   * Get real-time employee locations
   */
  async getLiveEmployeeLocations(): Promise<{
    employees: (Employee & { liveLocation?: LiveTrackingData })[];
    error: string | null;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all employees with their current attendance
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          attendance_records!inner (
            id,
            clock_in,
            status,
            location_lat,
            location_lng,
            location_address
          )
        `)
        .eq('attendance_records.date', today)
        .in('attendance_records.status', ['working', 'break']);

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees = data.map((profile: any) => {
        const attendance = profile.attendance_records[0];
        
        return {
          id: profile.id,
          name: profile.name,
          employeeId: profile.employee_id,
          position: profile.position || '',
          department: profile.department || '',
          avatar: profile.avatar_url || '',
          status: attendance.status === 'working' ? 'online' : 'break',
          workHours: profile.work_schedule || '09:00-18:00',
          location: profile.location || '',
          phone: profile.phone || '',
          email: profile.email,
          joinDate: profile.join_date,
          isActive: true,
          liveLocation: {
            employeeId: profile.id,
            location: {
              latitude: parseFloat(attendance.location_lat),
              longitude: parseFloat(attendance.location_lng),
              address: attendance.location_address,
            },
            timestamp: new Date(attendance.clock_in),
            status: attendance.status,
          },
        } as Employee & { liveLocation: LiveTrackingData };
      });

      return { employees, error: null };
    } catch (error) {
      return { employees: [], error: handleSupabaseError(error) };
    }
  },

  /**
   * Update employee location
   */
  async updateEmployeeLocation(
    userId: string,
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    }
  ): Promise<{ error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update current attendance record with new location
      const { error } = await supabase
        .from('attendance_records')
        .update({
          location_lat: location.latitude,
          location_lng: location.longitude,
          location_address: location.address || 'Unknown Location',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('date', today);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  /**
   * Get office locations with employee counts
   */
  async getOfficeLocations(): Promise<{
    locations: OfficeLocation[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('work_locations')
        .select('*')
        .eq('active', true);

      if (error) {
        return { locations: [], error: handleSupabaseError(error) };
      }

      // Get employee counts for each location (mock for now)
      const locations: OfficeLocation[] = data.map((location: any) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        coordinates: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
        },
        radius: location.radius,
        activeEmployees: Math.floor(Math.random() * 15) + 1, // Mock count
      }));

      return { locations, error: null };
    } catch (error) {
      return { locations: [], error: handleSupabaseError(error) };
    }
  },

  /**
   * Subscribe to real-time location updates
   */
  subscribeToLocationUpdates(callback: (data: LiveTrackingData) => void) {
    const subscription = supabase
      .channel('live-tracking-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          const record = payload.new;
          if (record.status === 'working' || record.status === 'break') {
            const trackingData: LiveTrackingData = {
              employeeId: record.user_id,
              location: {
                latitude: parseFloat(record.location_lat),
                longitude: parseFloat(record.location_lng),
                address: record.location_address,
              },
              timestamp: new Date(record.updated_at),
              status: record.status,
            };
            callback(trackingData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  /**
   * Get tracking statistics
   */
  async getTrackingStats(): Promise<{
    stats: {
      totalEmployees: number;
      activeEmployees: number;
      onBreakEmployees: number;
      officeLocations: number;
    };
    error: string | null;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [employeesResult, locationsResult] = await Promise.all([
        supabase
          .from('attendance_records')
          .select('status')
          .eq('date', today),
        supabase
          .from('work_locations')
          .select('id')
          .eq('active', true),
      ]);

      if (employeesResult.error) {
        return {
          stats: { totalEmployees: 0, activeEmployees: 0, onBreakEmployees: 0, officeLocations: 0 },
          error: handleSupabaseError(employeesResult.error),
        };
      }

      const attendanceRecords = employeesResult.data || [];
      const activeEmployees = attendanceRecords.filter(r => r.status === 'working').length;
      const onBreakEmployees = attendanceRecords.filter(r => r.status === 'break').length;
      const officeLocations = locationsResult.data?.length || 0;

      return {
        stats: {
          totalEmployees: attendanceRecords.length,
          activeEmployees,
          onBreakEmployees,
          officeLocations,
        },
        error: null,
      };
    } catch (error) {
      return {
        stats: { totalEmployees: 0, activeEmployees: 0, onBreakEmployees: 0, officeLocations: 0 },
        error: handleSupabaseError(error),
      };
    }
  },
};