import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export interface StatusUpdate {
  employeeId: string;
  status: 'online' | 'break' | 'offline';
  timestamp: Date;
  attendanceId?: string;
}

export interface RealTimeSyncOptions {
  onStatusUpdate?: (update: StatusUpdate) => void;
  onEmployeeUpdate?: (employee: Employee) => void;
  onError?: (error: string) => void;
  enableDebugLogging?: boolean;
}

export class RealTimeSyncService {
  private static instance: RealTimeSyncService;
  private subscriptions: Map<string, any> = new Map();
  private isInitialized = false;
  private debugLogging = false;

  public static getInstance(): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      RealTimeSyncService.instance = new RealTimeSyncService();
    }
    return RealTimeSyncService.instance;
  }

  /**
   * Initialize real-time synchronization
   */
  async initialize(options: RealTimeSyncOptions = {}): Promise<void> {
    if (this.isInitialized) {
      console.log('Real-time sync already initialized');
      return;
    }

    this.debugLogging = options.enableDebugLogging || false;
    this.log('Initializing real-time synchronization...');

    try {
      // Subscribe to attendance record changes
      await this.subscribeToAttendanceChanges(options);
      
      // Subscribe to profile changes
      await this.subscribeToProfileChanges(options);
      
      // Subscribe to activity record changes
      await this.subscribeToActivityChanges(options);

      this.isInitialized = true;
      this.log('Real-time synchronization initialized successfully');
    } catch (error) {
      console.error('Failed to initialize real-time sync:', error);
      options.onError?.(error instanceof Error ? error.message : 'Initialization failed');
    }
  }

  /**
   * Subscribe to attendance record changes for status updates
   */
  private async subscribeToAttendanceChanges(options: RealTimeSyncOptions): Promise<void> {
    const subscription = supabase
      .channel('attendance-status-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          this.log('Attendance record updated:', payload);
          this.handleAttendanceUpdate(payload, options);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          this.log('New attendance record:', payload);
          this.handleAttendanceUpdate(payload, options);
        }
      )
      .subscribe((status) => {
        this.log('Attendance subscription status:', status);
      });

    this.subscriptions.set('attendance', subscription);
  }

  /**
   * Subscribe to profile changes
   */
  private async subscribeToProfileChanges(options: RealTimeSyncOptions): Promise<void> {
    const subscription = supabase
      .channel('profile-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          this.log('Profile updated:', payload);
          this.handleProfileUpdate(payload, options);
        }
      )
      .subscribe((status) => {
        this.log('Profile subscription status:', status);
      });

    this.subscriptions.set('profiles', subscription);
  }

  /**
   * Subscribe to activity record changes for break status
   */
  private async subscribeToActivityChanges(options: RealTimeSyncOptions): Promise<void> {
    const subscription = supabase
      .channel('activity-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_records',
        },
        (payload) => {
          this.log('New activity record:', payload);
          this.handleActivityUpdate(payload, options);
        }
      )
      .subscribe((status) => {
        this.log('Activity subscription status:', status);
      });

    this.subscriptions.set('activities', subscription);
  }

  /**
   * Handle attendance record updates
   */
  private handleAttendanceUpdate(payload: any, options: RealTimeSyncOptions): void {
    try {
      const record = payload.new;
      const oldRecord = payload.old;
      
      // Check if status actually changed
      if (oldRecord && record.status === oldRecord.status) {
        return;
      }

      const statusUpdate: StatusUpdate = {
        employeeId: record.user_id,
        status: this.mapAttendanceStatusToEmployeeStatus(record.status),
        timestamp: new Date(record.updated_at),
        attendanceId: record.id,
      };

      this.log('Status update detected:', statusUpdate);
      options.onStatusUpdate?.(statusUpdate);
    } catch (error) {
      console.error('Error handling attendance update:', error);
      options.onError?.(error instanceof Error ? error.message : 'Attendance update error');
    }
  }

  /**
   * Handle profile updates
   */
  private handleProfileUpdate(payload: any, options: RealTimeSyncOptions): void {
    try {
      const profile = payload.new;
      
      // Create employee object from profile
      const employee: Partial<Employee> = {
        id: profile.id,
        name: profile.name,
        employeeId: profile.employee_id,
        position: profile.position || '',
        department: profile.department || '',
        avatar: profile.avatar_url || '',
        workHours: profile.work_schedule || '09:00-18:00',
        location: profile.location || '',
        phone: profile.phone || '',
        email: profile.email,
        joinDate: profile.join_date,
        isActive: true,
      };

      this.log('Employee profile updated:', employee);
      options.onEmployeeUpdate?.(employee as Employee);
    } catch (error) {
      console.error('Error handling profile update:', error);
      options.onError?.(error instanceof Error ? error.message : 'Profile update error');
    }
  }

  /**
   * Handle activity record updates (for break status)
   */
  private handleActivityUpdate(payload: any, options: RealTimeSyncOptions): void {
    try {
      const activity = payload.new;
      
      // Get the attendance record to find the user
      this.getAttendanceRecordForActivity(activity.attendance_id)
        .then(attendanceRecord => {
          if (attendanceRecord) {
            let newStatus: 'online' | 'break' | 'offline' = 'online';
            
            switch (activity.type) {
              case 'break_start':
                newStatus = 'break';
                break;
              case 'break_end':
                newStatus = 'online';
                break;
              case 'clock_out':
                newStatus = 'offline';
                break;
              default:
                newStatus = 'online';
            }

            const statusUpdate: StatusUpdate = {
              employeeId: attendanceRecord.user_id,
              status: newStatus,
              timestamp: new Date(activity.timestamp),
              attendanceId: activity.attendance_id,
            };

            this.log('Activity-based status update:', statusUpdate);
            options.onStatusUpdate?.(statusUpdate);
          }
        })
        .catch(error => {
          console.error('Error getting attendance record for activity:', error);
        });
    } catch (error) {
      console.error('Error handling activity update:', error);
      options.onError?.(error instanceof Error ? error.message : 'Activity update error');
    }
  }

  /**
   * Get attendance record for activity
   */
  private async getAttendanceRecordForActivity(attendanceId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('user_id, status')
        .eq('id', attendanceId)
        .single();

      if (error) {
        console.error('Error fetching attendance record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAttendanceRecordForActivity:', error);
      return null;
    }
  }

  /**
   * Map attendance status to employee status
   */
  private mapAttendanceStatusToEmployeeStatus(attendanceStatus: string): 'online' | 'break' | 'offline' {
    switch (attendanceStatus) {
      case 'working':
        return 'online';
      case 'break':
        return 'break';
      case 'completed':
        return 'offline';
      default:
        return 'offline';
    }
  }

  /**
   * Manually trigger status sync for debugging
   */
  async triggerStatusSync(employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.log(`Manually triggering status sync for employee: ${employeeId}`);
      
      // Get current attendance status
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_records')
        .select('status, updated_at')
        .eq('user_id', employeeId)
        .eq('date', today)
        .single();

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      if (data) {
        const statusUpdate: StatusUpdate = {
          employeeId,
          status: this.mapAttendanceStatusToEmployeeStatus(data.status),
          timestamp: new Date(data.updated_at),
        };

        this.log('Manual status sync result:', statusUpdate);
        return { success: true };
      }

      return { success: false, error: 'No attendance record found for today' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Manual sync failed' 
      };
    }
  }

  /**
   * Get current sync status for debugging
   */
  getSyncStatus(): {
    isInitialized: boolean;
    activeSubscriptions: string[];
    subscriptionCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
      subscriptionCount: this.subscriptions.size,
    };
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.log('Cleaning up real-time subscriptions...');
    
    this.subscriptions.forEach((subscription, key) => {
      try {
        supabase.removeChannel(subscription);
        this.log(`Removed subscription: ${key}`);
      } catch (error) {
        console.error(`Error removing subscription ${key}:`, error);
      }
    });

    this.subscriptions.clear();
    this.isInitialized = false;
    this.log('Real-time sync cleanup completed');
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.debugLogging) {
      console.log(`[RealTimeSync] ${message}`, data || '');
    }
  }
}

// Convenience instance
export const realTimeSyncService = RealTimeSyncService.getInstance();