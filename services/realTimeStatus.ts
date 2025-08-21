import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export interface EmployeeStatusUpdate {
  employeeId: string;
  status: 'online' | 'break' | 'offline';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  attendanceId?: string;
}

export interface StatusStats {
  totalEmployees: number;
  onlineEmployees: number;
  breakEmployees: number;
  offlineEmployees: number;
}

export interface RealTimeStatusOptions {
  onStatusUpdate?: (update: EmployeeStatusUpdate) => void;
  onStatsUpdate?: (stats: StatusStats) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
  enableDebugLogging?: boolean;
}

export class RealTimeStatusService {
  private static instance: RealTimeStatusService;
  private channel: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private options: RealTimeStatusOptions = {};
  private employeeStatusCache = new Map<string, EmployeeStatusUpdate>();
  private statsCache: StatusStats | null = null;

  public static getInstance(): RealTimeStatusService {
    if (!RealTimeStatusService.instance) {
      RealTimeStatusService.instance = new RealTimeStatusService();
    }
    return RealTimeStatusService.instance;
  }

  /**
   * Initialize real-time status monitoring
   */
  async initialize(options: RealTimeStatusOptions = {}): Promise<void> {
    this.options = options;
    this.log('Initializing real-time status service...');

    try {
      await this.setupRealtimeChannel();
      await this.loadInitialData();
      this.startHeartbeat();
      
      this.log('Real-time status service initialized successfully');
    } catch (error) {
      this.handleError('Failed to initialize real-time status service', error);
    }
  }

  /**
   * Setup Supabase realtime channel for status updates
   */
  private async setupRealtimeChannel(): Promise<void> {
    try {
      // Remove existing channel if any
      if (this.channel) {
        await supabase.removeChannel(this.channel);
      }

      this.channel = supabase
        .channel('employee-status-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'attendance_records',
          },
          (payload) => this.handleAttendanceUpdate(payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_records',
          },
          (payload) => this.handleActivityUpdate(payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'employee_status',
          },
          (payload) => this.handleEmployeeStatusUpdate(payload)
        )
        .subscribe((status) => {
          this.log('Channel subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.options.onConnectionChange?.(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.isConnected = false;
            this.options.onConnectionChange?.(false);
            this.attemptReconnection();
          }
        });

    } catch (error) {
      throw new Error(`Failed to setup realtime channel: ${error}`);
    }
  }

  /**
   * Handle attendance record updates
   */
  private async handleAttendanceUpdate(payload: any): Promise<void> {
    try {
      const record = payload.new;
      const oldRecord = payload.old;

      // Skip if status hasn't changed
      if (oldRecord && record.status === oldRecord.status) {
        return;
      }

      const statusUpdate: EmployeeStatusUpdate = {
        employeeId: record.user_id,
        status: this.mapAttendanceStatusToEmployeeStatus(record.status),
        timestamp: new Date(record.updated_at),
        location: {
          latitude: parseFloat(record.location_lat),
          longitude: parseFloat(record.location_lng),
          address: record.location_address,
        },
        attendanceId: record.id,
      };

      this.updateEmployeeStatusCache(statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
      
      // Update stats
      await this.updateStats();
      
      this.log('Attendance status update processed:', statusUpdate);
    } catch (error) {
      this.handleError('Error processing attendance update', error);
    }
  }

  /**
   * Handle activity record updates
   */
  private async handleActivityUpdate(payload: any): Promise<void> {
    try {
      const activity = payload.new;
      
      // Get attendance record to determine user
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('user_id, location_lat, location_lng, location_address')
        .eq('id', activity.attendance_id)
        .single();

      if (!attendance) return;

      let newStatus: 'online' | 'break' | 'offline';
      
      switch (activity.type) {
        case 'clock_in':
          newStatus = 'online';
          break;
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

      const statusUpdate: EmployeeStatusUpdate = {
        employeeId: attendance.user_id,
        status: newStatus,
        timestamp: new Date(activity.timestamp),
        location: {
          latitude: parseFloat(attendance.location_lat),
          longitude: parseFloat(attendance.location_lng),
          address: attendance.location_address,
        },
        attendanceId: activity.attendance_id,
      };

      this.updateEmployeeStatusCache(statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
      
      // Update stats
      await this.updateStats();
      
      this.log('Activity status update processed:', statusUpdate);
    } catch (error) {
      this.handleError('Error processing activity update', error);
    }
  }

  /**
   * Handle direct employee status updates
   */
  private handleEmployeeStatusUpdate(payload: any): void {
    try {
      const record = payload.new;
      
      const statusUpdate: EmployeeStatusUpdate = {
        employeeId: record.user_id,
        status: record.status,
        timestamp: new Date(record.last_activity),
        location: record.location_lat && record.location_lng ? {
          latitude: parseFloat(record.location_lat),
          longitude: parseFloat(record.location_lng),
          address: record.location_address,
        } : undefined,
      };

      this.updateEmployeeStatusCache(statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
      
      this.log('Direct status update processed:', statusUpdate);
    } catch (error) {
      this.handleError('Error processing employee status update', error);
    }
  }

  /**
   * Load initial employee status data
   */
  private async loadInitialData(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all employees with their current status
      const { data: employees, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          employee_id,
          position,
          department,
          avatar_url,
          attendance_records!left (
            id,
            status,
            clock_in,
            location_lat,
            location_lng,
            location_address,
            updated_at
          )
        `)
        .eq('attendance_records.date', today);

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      // Process initial status data
      employees.forEach((employee: any) => {
        const attendance = employee.attendance_records?.[0];
        let status: 'online' | 'break' | 'offline' = 'offline';

        if (attendance) {
          status = this.mapAttendanceStatusToEmployeeStatus(attendance.status);
        }

        const statusUpdate: EmployeeStatusUpdate = {
          employeeId: employee.id,
          status,
          timestamp: attendance ? new Date(attendance.updated_at) : new Date(),
          location: attendance ? {
            latitude: parseFloat(attendance.location_lat),
            longitude: parseFloat(attendance.location_lng),
            address: attendance.location_address,
          } : undefined,
          attendanceId: attendance?.id,
        };

        this.updateEmployeeStatusCache(statusUpdate);
      });

      // Calculate initial stats
      await this.updateStats();
      
      this.log(`Loaded initial status for ${employees.length} employees`);
    } catch (error) {
      this.handleError('Failed to load initial status data', error);
    }
  }

  /**
   * Update employee status cache
   */
  private updateEmployeeStatusCache(update: EmployeeStatusUpdate): void {
    this.employeeStatusCache.set(update.employeeId, update);
  }

  /**
   * Update statistics
   */
  private async updateStats(): Promise<void> {
    try {
      const statusCounts = {
        totalEmployees: 0,
        onlineEmployees: 0,
        breakEmployees: 0,
        offlineEmployees: 0,
      };

      this.employeeStatusCache.forEach((status) => {
        statusCounts.totalEmployees++;
        switch (status.status) {
          case 'online':
            statusCounts.onlineEmployees++;
            break;
          case 'break':
            statusCounts.breakEmployees++;
            break;
          case 'offline':
            statusCounts.offlineEmployees++;
            break;
        }
      });

      this.statsCache = statusCounts;
      this.options.onStatsUpdate?.(statusCounts);
      
      this.log('Stats updated:', statusCounts);
    } catch (error) {
      this.handleError('Failed to update stats', error);
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
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        if (this.isConnected) {
          // Send heartbeat to maintain connection
          await this.sendHeartbeat();
        }
      } catch (error) {
        this.log('Heartbeat failed:', error);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Send heartbeat to server
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_heartbeat', {
        connection_id: this.getConnectionId(),
        device_info: this.getDeviceInfo(),
      });

      if (error) {
        this.log('Heartbeat error:', error);
      }
    } catch (error) {
      this.log('Heartbeat failed:', error);
    }
  }

  /**
   * Attempt to reconnect after connection loss
   */
  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError('Max reconnection attempts reached', new Error('Connection failed'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.setupRealtimeChannel();
      } catch (error) {
        this.handleError('Reconnection failed', error);
        this.attemptReconnection();
      }
    }, delay);
  }

  /**
   * Get current employee status
   */
  getEmployeeStatus(employeeId: string): EmployeeStatusUpdate | null {
    return this.employeeStatusCache.get(employeeId) || null;
  }

  /**
   * Get current stats
   */
  getCurrentStats(): StatusStats | null {
    return this.statsCache;
  }

  /**
   * Get all cached employee statuses
   */
  getAllEmployeeStatuses(): Map<string, EmployeeStatusUpdate> {
    return new Map(this.employeeStatusCache);
  }

  /**
   * Manually refresh employee status
   */
  async refreshEmployeeStatus(employeeId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', employeeId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(handleSupabaseError(error));
      }

      let status: 'online' | 'break' | 'offline' = 'offline';
      
      if (data) {
        status = this.mapAttendanceStatusToEmployeeStatus(data.status);
      }

      const statusUpdate: EmployeeStatusUpdate = {
        employeeId,
        status,
        timestamp: data ? new Date(data.updated_at) : new Date(),
        location: data ? {
          latitude: parseFloat(data.location_lat),
          longitude: parseFloat(data.location_lng),
          address: data.location_address,
        } : undefined,
        attendanceId: data?.id,
      };

      this.updateEmployeeStatusCache(statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
      
      this.log('Employee status refreshed:', statusUpdate);
    } catch (error) {
      this.handleError(`Failed to refresh status for employee ${employeeId}`, error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    lastError?: string;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Force reconnection
   */
  async forceReconnect(): Promise<void> {
    this.log('Forcing reconnection...');
    this.reconnectAttempts = 0;
    this.isConnected = false;
    await this.setupRealtimeChannel();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.log('Cleaning up real-time status service...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.isConnected = false;
    this.employeeStatusCache.clear();
    this.statsCache = null;
    
    this.log('Real-time status service cleaned up');
  }

  /**
   * Get unique connection ID
   */
  private getConnectionId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): any {
    return {
      platform: 'react-native',
      timestamp: new Date().toISOString(),
      userAgent: 'AttendanceApp/1.0.0',
    };
  }

  /**
   * Handle errors with proper logging
   */
  private handleError(message: string, error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = `${message}: ${errorMessage}`;
    
    console.error(fullMessage);
    this.options.onError?.(fullMessage);
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.options.enableDebugLogging) {
      console.log(`[RealTimeStatus] ${message}`, data || '');
    }
  }
}

// Convenience instance
export const realTimeStatusService = RealTimeStatusService.getInstance();