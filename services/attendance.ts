import { supabase, handleSupabaseError } from '@/lib/supabase';
import { AttendanceRecord, ActivityRecord } from '@/types';

export interface ClockInData {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  selfieUrl?: string;
}

export interface ClockOutData {
  attendanceId: string;
  selfieUrl?: string;
  notes?: string;
  workHours: number;
  breakTime: number;
  overtimeHours: number;
  clientVisitTime: number;
}

export interface ActivityData {
  attendanceId: string;
  userId: string;
  type: ActivityRecord['type'];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  selfieUrl?: string;
}

export const attendanceService = {
  // Clock in user
  async clockIn(data: ClockInData): Promise<{ attendance: AttendanceRecord | null; error: string | null }> {
    try {
      // Upload selfie first if provided
      let uploadedSelfieUrl = data.selfieUrl;
      if (data.selfieUrl && !data.selfieUrl.startsWith('http')) {
        // If selfieUrl is a local URI, upload it first
        const { imageService } = await import('./imageService');
        const uploadResult = await imageService.uploadSelfie(data.userId, data.selfieUrl, 'clock_in');
        
        if (uploadResult.error) {
          return { attendance: null, error: `Failed to upload selfie: ${uploadResult.error}` };
        }
        
        uploadedSelfieUrl = uploadResult.url || undefined;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Check if user already clocked in today
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', data.userId)
        .eq('date', today)
        .single();

      if (existing) {
        return { attendance: null, error: 'You have already clocked in today' };
      }

      // Create attendance record
      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .insert({
          user_id: data.userId,
          clock_in: now.toISOString(),
          date: today,
          location_lat: data.location.latitude,
          location_lng: data.location.longitude,
          location_address: data.location.address,
          selfie_url: uploadedSelfieUrl,
          status: 'working',
        })
        .select()
        .single();

      if (error) {
        return { attendance: null, error: handleSupabaseError(error) };
      }

      // Create clock in activity
      await this.addActivity({
        attendanceId: attendance.id,
        userId: data.userId,
        type: 'clock_in',
        location: data.location,
        selfieUrl: uploadedSelfieUrl,
      });

      return {
        attendance: this.mapAttendanceRecord(attendance),
        error: null,
      };
    } catch (error) {
      return { attendance: null, error: handleSupabaseError(error) };
    }
  },

  // Clock out user
  async clockOut(data: ClockOutData): Promise<{ error: string | null }> {
    try {
      // Upload selfie first if provided
      let uploadedSelfieUrl = data.selfieUrl;
      if (data.selfieUrl && !data.selfieUrl.startsWith('http')) {
        // Get user ID from attendance record
        const { data: attendance } = await supabase
          .from('attendance_records')
          .select('user_id')
          .eq('id', data.attendanceId)
          .single();

        if (attendance) {
          const { imageService } = await import('./imageService');
          const uploadResult = await imageService.uploadSelfie(attendance.user_id, data.selfieUrl, 'clock_out');
          
          if (uploadResult.error) {
            return { error: `Failed to upload selfie: ${uploadResult.error}` };
          }
          
          uploadedSelfieUrl = uploadResult.url || undefined;
        }
      }

      const now = new Date();

      // Update attendance record
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({
          clock_out: now.toISOString(),
          status: 'completed',
          notes: data.notes,
          updated_at: now.toISOString(),
          work_hours: data.workHours,
          break_time: data.breakTime,
          overtime_hours: data.overtimeHours,
          client_visit_time: data.clientVisitTime,
        })
        .eq('id', data.attendanceId);

      if (updateError) {
        return { error: handleSupabaseError(updateError) };
      }

      // Get attendance record to add activity
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('user_id, location_lat, location_lng, location_address')
        .eq('id', data.attendanceId)
        .single();

      if (attendance) {
        // Create clock out activity
        await this.addActivity({
          attendanceId: data.attendanceId,
          userId: attendance.user_id,
          type: 'clock_out',
          location: {
            latitude: attendance.location_lat,
            longitude: attendance.location_lng,
            address: attendance.location_address,
          },
          selfieUrl: uploadedSelfieUrl,
        });
      }

      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Add activity record
  async addActivity(data: ActivityData): Promise<{ error: string | null }> {
    try {
      // Upload selfie first if provided
      let uploadedSelfieUrl = data.selfieUrl;
      if (data.selfieUrl && !data.selfieUrl.startsWith('http')) {
        const { imageService } = await import('./imageService');
        const uploadResult = await imageService.uploadSelfie(data.userId, data.selfieUrl, data.type as any);
        
        if (uploadResult.error) {
          return { error: `Failed to upload selfie: ${uploadResult.error}` };
        }
        
        uploadedSelfieUrl = uploadResult.url || undefined;
      }

      const { data: insertedActivity, error } = await supabase
        .from('activity_records')
        .insert({
          attendance_id: data.attendanceId,
          user_id: data.userId,
          type: data.type,
          timestamp: new Date().toISOString(),
          location_lat: data.location?.latitude,
          location_lng: data.location?.longitude,
          location_address: data.location?.address,
          notes: data.notes,
          selfie_url: uploadedSelfieUrl,
        });

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      // Update attendance status based on activity type
      if (data.type === 'break_start') {
        await this.updateAttendanceStatus(data.attendanceId, 'break');
      } else if (data.type === 'break_end') {
        await this.updateAttendanceStatus(data.attendanceId, 'working');
        // Calculate break duration and update break_time
        const { data: breakStart } = await supabase
          .from('activity_records')
          .select('timestamp')
          .eq('attendance_id', data.attendanceId)
          .eq('type', 'break_start')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (breakStart) {
          const breakStartTime = new Date(breakStart.timestamp);
          const breakEndTime = new Date();
          const breakDuration = Math.floor((breakEndTime.getTime() - breakStartTime.getTime()) / 1000 / 60); // in minutes, rounded down to integer

          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('break_time')
            .eq('id', data.attendanceId)
            .single();

          if (attendance) {
            await supabase
              .from('attendance_records')
              .update({ break_time: (attendance.break_time || 0) + breakDuration })
              .eq('id', data.attendanceId);
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Get current attendance for user
  async getCurrentAttendance(userId: string): Promise<{ attendance: AttendanceRecord | null; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          activity_records (
            id,
            type,
            timestamp,
            location_lat,
            location_lng,
            location_address,
            notes,
            selfie_url
          )
        `)
        .eq('user_id', userId)
        .eq('date', today)
        .order('timestamp', { ascending: true, referencedTable: 'activity_records' })
        .single();

      if (error && error.code !== 'PGRST116') {
        return { attendance: null, error: handleSupabaseError(error) };
      }

      if (!data) {
        return { attendance: null, error: null };
      }

      // Debug logging for activity records
      console.log(`Current attendance activities:`, {
        attendanceId: data.id,
        activitiesCount: data.activity_records?.length || 0,
        activitiesWithPhotos: data.activity_records?.filter((act: any) => act.selfie_url).length || 0,
        activityTypes: data.activity_records?.map((act: any) => act.type) || []
      });
      return {
        attendance: this.mapAttendanceRecord(data),
        error: null,
      };
    } catch (error) {
      return { attendance: null, error: handleSupabaseError(error) };
    }
  },

  // Get attendance history
  async getAttendanceHistory(userId: string, limit = 30): Promise<{ records: AttendanceRecord[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          activity_records (
            id,
            type,
            timestamp,
            location_lat,
            location_lng,
            location_address,
            notes,
            selfie_url
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('timestamp', { ascending: true, referencedTable: 'activity_records' })
        .limit(limit);

      if (error) {
        return { records: [], error: handleSupabaseError(error) };
      }

      const records = data.map((record: any) => this.mapAttendanceRecord(record));
      
      // Debug logging for attendance history
      console.log(`Attendance history loaded:`, {
        recordsCount: records.length,
        recordsWithPhotos: records.filter(r => r.selfieUrl || r.activities.some(a => a.selfieUrl)).length,
        totalActivities: records.reduce((sum, r) => sum + r.activities.length, 0),
        activitiesWithPhotos: records.reduce((sum, r) => sum + r.activities.filter(a => a.selfieUrl).length, 0)
      });
      
      return { records, error: null };
    } catch (error) {
      return { records: [], error: handleSupabaseError(error) };
    }
  },

  // Get today's activities
  async getTodayActivities(userId: string): Promise<{ activities: ActivityRecord[]; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('activity_records')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', `${today}T00:00:00.000Z`)
        .lt('timestamp', `${today}T23:59:59.999Z`)
        .order('timestamp', { ascending: false });

      if (error) {
        return { activities: [], error: handleSupabaseError(error) };
      }

      const activities = data.map((activity: any) => this.mapActivityRecord(activity));
      return { activities, error: null };
    } catch (error) {
      return { activities: [], error: handleSupabaseError(error) };
    }
  },

  // Update attendance status
  async updateAttendanceStatus(
    attendanceId: string,
    status: AttendanceRecord['status']
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .select()
      
      // Log successful activity creation with selfie URL for debugging
      console.log(`Activity created successfully:`, {
        id: insertedActivity?.id,
        type: data.type,
        selfieUrl: uploadedSelfieUrl,
        hasPhoto: !!uploadedSelfieUrl
      });
        .single();
        .eq('id', attendanceId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Helper function to map database record to AttendanceRecord
  mapAttendanceRecord(data: any): AttendanceRecord {
    // Convert selfie_url to a public URL
    let selfiePath = data.selfie_url;
    let selfieUrl = undefined;

    if (selfiePath && selfiePath.trim() !== '') {
      // Handle both old and new URL formats
      if (selfiePath.startsWith('http')) {
        // Already a full URL
        selfieUrl = selfiePath;
      } else {
        // Handle relative paths and storage paths
        const cleanPath = selfiePath.replace(/^selfies\//, '').replace(/^activities\//, '');
        
        try {
          // Try to get public URL from selfies bucket
          const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(cleanPath);
          selfieUrl = publicUrl;
        } catch (error) {
          console.error('Error generating public URL for selfie:', error);
          // Fallback to direct URL construction
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
          selfieUrl = `${supabaseUrl}/storage/v1/object/public/selfies/${cleanPath}`;
        }
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      clockIn: new Date(data.clock_in),
      clockOut: data.clock_out ? new Date(data.clock_out) : undefined,
      date: data.date,
      workHours: data.work_hours || 0,
      breakTime: data.break_time || 0,
      overtimeHours: data.overtime_hours || 0,
      clientVisitTime: data.client_visit_time || 0,
      status: data.status,
      location: {
        latitude: parseFloat(data.location_lat),
        longitude: parseFloat(data.location_lng),
        address: data.location_address,
      },
      selfieUrl: selfieUrl,
      notes: data.notes,
      activities: data.activity_records ? data.activity_records.map((act: any) => this.mapActivityRecord(act)) : [],
      breakStartTime: null,
    };
  },

  // Helper function to map database record to ActivityRecord
  mapActivityRecord(data: any): ActivityRecord {
    // Process selfie URL for activity records
    let selfieUrl = this.processActivitySelfieUrl(data.selfie_url);
    
    // Debug logging for activity selfie URLs
    if (data.selfie_url && !selfieUrl) {
      console.warn(`Failed to process selfie URL for activity ${data.id}: ${data.selfie_url}`);
    }

    return {
      id: data.id,
      type: data.type,
      timestamp: new Date(data.timestamp),
      location: data.location_lat && data.location_lng ? {
        latitude: parseFloat(data.location_lat),
        longitude: parseFloat(data.location_lng),
        address: data.location_address,
      } : undefined,
      notes: data.notes,
      selfieUrl: selfieUrl,
    };
  },

  // Enhanced helper function to process activity selfie URLs
  processActivitySelfieUrl(selfiePath: string | null | undefined): string | undefined {
    if (!selfiePath || selfiePath.trim() === '') {
      return undefined;
    }

    // Handle both old and new URL formats
    if (selfiePath.startsWith('http')) {
      // Already a full URL
      return selfiePath;
    }

    // Handle relative paths and storage paths - ensure proper path cleaning
    let cleanPath = selfiePath;
    
    // Remove common prefixes
    cleanPath = cleanPath.replace(/^selfies\//, '');
    cleanPath = cleanPath.replace(/^activities\//, '');
    
    // Handle user-specific paths
    if (!cleanPath.includes('/')) {
      // If no path separator, this might be just a filename
      console.warn(`Activity selfie path missing user folder: ${selfiePath}`);
    }
    
    try {
      // Try to get public URL from selfies bucket (all activity selfies are stored in selfies bucket)
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(cleanPath);
      
      // Validate the generated URL
      if (!publicUrl || publicUrl.includes('undefined')) {
        console.error(`Invalid public URL generated for path: ${cleanPath}`);
        return undefined;
      }
      
      return publicUrl;
    } catch (error) {
      console.error('Error generating public URL for activity selfie:', error);
      // Fallback to direct URL construction
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/selfies/${cleanPath}`;
      
      // Validate fallback URL
      if (fallbackUrl.includes('undefined') || !supabaseUrl) {
        console.error(`Invalid fallback URL: ${fallbackUrl}`);
        return undefined;
      }
      
      return fallbackUrl;
    }
  },
};