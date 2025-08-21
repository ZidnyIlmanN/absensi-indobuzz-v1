import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';

export interface EmployeeStatusUpdate {
  employeeId: string;
  status: 'online' | 'break' | 'offline';
  lastActivity: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  connectionId?: string;
  isManual?: boolean;
}

export interface StatusSubscriptionOptions {
  onStatusUpdate?: (update: EmployeeStatusUpdate) => void;
  onEmployeeJoin?: (employee: Employee) => void;
  onEmployeeLeave?: (employeeId: string) => void;
  onConnectionError?: (error: string) => void;
  onReconnect?: () => void;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number; // in milliseconds
}

export interface StatusStatistics {
  totalEmployees: number;
  onlineCount: number;
  breakCount: number;
  offlineCount: number;
  connectedCount: number;
  lastUpdated: Date;
}

export class RealTimeStatusService {
  private static instance: RealTimeStatusService;
  private subscriptions: Map<string, any> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionId: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private options: StatusSubscriptionOptions = {};

  public static getInstance(): RealTimeStatusService {
    if (!RealTimeStatusService.instance) {
      RealTimeStatusService.instance = new RealTimeStatusService();
    }
    return RealTimeStatusService.instance;
  }

  constructor() {
    this.connectionId = this.generateConnectionId();
  }

  /**
   * Initialize real-time status monitoring
   */
  async initialize(options: StatusSubscriptionOptions = {}): Promise<void> {
    this.options = options;
    
    try {
      console.log('🔄 Initializing real-time status service...');
      
      // Subscribe to employee status changes
      await this.subscribeToStatusUpdates();
      
      // Subscribe to attendance changes that affect status
      await this.subscribeToAttendanceChanges();
      
      // Subscribe to activity changes that affect status
      await this.subscribeToActivityChanges();
      
      // Start heartbeat if enabled
      if (options.enableHeartbeat !== false) {
        this.startHeartbeat(options.heartbeatInterval || 30000);
      }
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Real-time status service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize real-time status service:', error);
      this.options.onConnectionError?.(
        error instanceof Error ? error.message : 'Initialization failed'
      );
      
      // Attempt reconnection
      this.attemptReconnection();
    }
  }

  /**
   * Subscribe to employee status updates
   */
  private async subscribeToStatusUpdates(): Promise<void> {
    const statusSubscription = supabase
      .channel('employee-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_status',
        },
        (payload) => {
          this.handleStatusUpdate(payload);
        }
      )
      .on(
        'broadcast',
        { event: 'status_change' },
        (payload) => {
          this.handleBroadcastStatusUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('Status subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to employee status updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Status subscription error');
          this.handleConnectionError('Status subscription failed');
        }
      });

    this.subscriptions.set('status', statusSubscription);
  }

  /**
   * Subscribe to attendance record changes
   */
  private async subscribeToAttendanceChanges(): Promise<void> {
    const attendanceSubscription = supabase
      .channel('attendance-status-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          this.handleAttendanceChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('Attendance subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to attendance changes');
        }
      });

    this.subscriptions.set('attendance', attendanceSubscription);
  }

  /**
   * Subscribe to activity record changes
   */
  private async subscribeToActivityChanges(): Promise<void> {
    const activitySubscription = supabase
      .channel('activity-status-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_records',
        },
        (payload) => {
          this.handleActivityChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('Activity subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to activity changes');
        }
      });

    this.subscriptions.set('activity', activitySubscription);
  }

  /**
   * Handle status update from database
   */
  private handleStatusUpdate(payload: any): void {
    try {
      const record = payload.new || payload.old;
      
      if (!record) return;

      const statusUpdate: EmployeeStatusUpdate = {
        employeeId: record.user_id,
        status: this.mapDatabaseStatusToEmployeeStatus(record.status),
        lastActivity: new Date(record.last_activity),
        location: record.location_lat && record.location_lng ? {
          latitude: parseFloat(record.location_lat),
          longitude: parseFloat(record.location_lng),
          address: record.location_address,
        } : undefined,
        connectionId: record.connection_id,
        isManual: record.is_manual,
      };

      console.log('📡 Status update received:', statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }

  /**
   * Handle broadcast status update
   */
  private handleBroadcastStatusUpdate(payload: any): void {
    try {
      const data = payload.payload;
      
      const statusUpdate: EmployeeStatusUpdate = {
        employeeId: data.employee_id,
        status: data.new_status,
        lastActivity: new Date(data.timestamp * 1000),
        location: data.location,
        isManual: data.is_manual,
      };

      console.log('📢 Broadcast status update received:', statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
    } catch (error) {
      console.error('Error handling broadcast status update:', error);
    }
  }

  /**
   * Handle attendance record changes
   */
  private handleAttendanceChange(payload: any): void {
    try {
      const record = payload.new;
      
      if (!record) return;

      let newStatus: 'online' | 'break' | 'offline' = 'offline';
      
      switch (record.status) {
        case 'working':
          newStatus = 'online';
          break;
        case 'break':
          newStatus = 'break';
          break;
        case 'completed':
          newStatus = 'offline';
          break;
        default:
          newStatus = 'offline';
      }

      const statusUpdate: EmployeeStatusUpdate = {
        employeeId: record.user_id,
        status: newStatus,
        lastActivity: new Date(record.updated_at),
        location: {
          latitude: parseFloat(record.location_lat),
          longitude: parseFloat(record.location_lng),
          address: record.location_address,
        },
        isManual: false,
      };

      console.log('📋 Attendance-based status update:', statusUpdate);
      this.options.onStatusUpdate?.(statusUpdate);
    } catch (error) {
      console.error('Error handling attendance change:', error);
    }
  }

  /**
   * Handle activity record changes
   */
  private handleActivityChange(payload: any): void {
    try {
      const activity = payload.new;
      
      if (!activity) return;

      // Get the attendance record to find user_id
      this.getAttendanceRecordForActivity(activity.attendance_id)
        .then(attendanceRecord => {
          if (!attendanceRecord) return;

          let newStatus: 'online' | 'break' | 'offline' = 'online';
          
          switch (activity.type) {
            case 'break_start':
              newStatus = 'break';
              break;
            case 'break_end':
            case 'overtime_start':
            case 'overtime_end':
            case 'client_visit_start':
            case 'client_visit_end':
              newStatus = 'online';
              break;
            case 'clock_out':
              newStatus = 'offline';
              break;
            default:
              newStatus = 'online';
          }

          const statusUpdate: EmployeeStatusUpdate = {
            employeeId: attendanceRecord.user_id,
            status: newStatus,
            lastActivity: new Date(activity.timestamp),
            location: activity.location_lat && activity.location_lng ? {
              latitude: parseFloat(activity.location_lat),
              longitude: parseFloat(activity.location_lng),
              address: activity.location_address,
            } : undefined,
            isManual: false,
          };

          console.log('🎯 Activity-based status update:', statusUpdate);
          this.options.onStatusUpdate?.(statusUpdate);
        })
        .catch(error => {
          console.error('Error getting attendance record for activity:', error);
        });
    } catch (error) {
      console.error('Error handling activity change:', error);
    }
  }

  /**
   * Get attendance record for activity
   */
  private async getAttendanceRecordForActivity(attendanceId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('user_id, status, location_lat, location_lng, location_address')
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
   * Manually update employee status
   */
  async updateEmployeeStatus(
    employeeId: string,
    status: 'online' | 'break' | 'offline',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Updating employee ${employeeId} status to ${status}`);

      const { error } = await supabase.rpc('update_employee_status', {
        target_user_id: employeeId,
        new_status: status,
        reason: reason || 'Manual update',
      });

      if (error) {
        console.error('❌ Status update failed:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      console.log('✅ Status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Status update error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Status update failed' 
      };
    }
  }

  /**
   * Get current status statistics
   */
  async getStatusStatistics(): Promise<{ stats: StatusStatistics | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_status_statistics');

      if (error) {
        return { stats: null, error: handleSupabaseError(error) };
      }

      const stats: StatusStatistics = {
        totalEmployees: data[0]?.total_employees || 0,
        onlineCount: data[0]?.online_count || 0,
        breakCount: data[0]?.break_count || 0,
        offlineCount: data[0]?.offline_count || 0,
        connectedCount: data[0]?.connected_count || 0,
        lastUpdated: new Date(),
      };

      return { stats, error: null };
    } catch (error) {
      return { 
        stats: null, 
        error: error instanceof Error ? error.message : 'Failed to get statistics' 
      };
    }
  }

  /**
   * Get team status for managers
   */
  async getTeamStatus(managerId?: string): Promise<{ 
    employees: Employee[]; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_team_status', {
        manager_id: managerId || null,
      });

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees: Employee[] = data.map((record: any) => ({
        id: record.employee_id,
        name: record.employee_name,
        employeeId: record.employee_number,
        position: record.position,
        department: record.department,
        avatar: record.avatar_url,
        status: record.current_status,
        workHours: '09:00-18:00', // Default
        location: record.location_address || '',
        phone: '',
        email: '',
        joinDate: '',
        isActive: record.is_connected,
      }));

      return { employees, error: null };
    } catch (error) {
      return { 
        employees: [], 
        error: error instanceof Error ? error.message : 'Failed to get team status' 
      };
    }
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('Heartbeat failed:', error);
        this.handleConnectionError('Heartbeat failed');
      }
    }, interval);

    console.log(`💓 Heartbeat started with ${interval}ms interval`);
  }

  /**
   * Send heartbeat to server
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_heartbeat', {
        connection_id: this.connectionId,
        device_info: {
          platform: 'mobile',
          timestamp: Date.now(),
          connectionId: this.connectionId,
        },
      });

      if (error) {
        throw new Error(handleSupabaseError(error));
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
      throw error;
    }
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(error: string): void {
    console.error('🔌 Connection error:', error);
    this.isConnected = false;
    this.options.onConnectionError?.(error);
    
    this.attemptReconnection();
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.options.onConnectionError?.('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        // Clean up existing subscriptions
        this.cleanup();
        
        // Generate new connection ID
        this.connectionId = this.generateConnectionId();
        
        // Reinitialize
        await this.initialize(this.options);
        
        console.log('✅ Reconnection successful');
        this.options.onReconnect?.();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, delay);
  }

  /**
   * Broadcast status change to all connected clients
   */
  async broadcastStatusChange(
    employeeId: string,
    status: 'online' | 'break' | 'offline',
    location?: { latitude: number; longitude: number; address: string }
  ): Promise<void> {
    try {
      const channel = supabase.channel('status-broadcast');
      
      await channel.send({
        type: 'broadcast',
        event: 'status_change',
        payload: {
          employee_id: employeeId,
          new_status: status,
          timestamp: Date.now(),
          location,
          connection_id: this.connectionId,
        },
      });

      console.log('📢 Status change broadcasted');
    } catch (error) {
      console.error('❌ Failed to broadcast status change:', error);
    }
  }

  /**
   * Get all employee statuses
   */
  async getAllEmployeeStatuses(): Promise<{ 
    employees: (Employee & { lastActivity?: Date; isConnected?: boolean })[]; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('employee_status_realtime')
        .select('*');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees = data.map((record: any) => ({
        id: record.id,
        name: record.name,
        employeeId: record.employee_id,
        position: record.position,
        department: record.department,
        avatar: record.avatar_url,
        status: record.current_status,
        workHours: '09:00-18:00',
        location: record.location_address || '',
        phone: '',
        email: '',
        joinDate: '',
        isActive: true,
        lastActivity: record.last_activity ? new Date(record.last_activity) : undefined,
        isConnected: record.is_connected,
      }));

      return { employees, error: null };
    } catch (error) {
      return { 
        employees: [], 
        error: error instanceof Error ? error.message : 'Failed to get employee statuses' 
      };
    }
  }

  /**
   * Force refresh of status cache
   */
  async refreshStatusCache(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('refresh_employee_status_realtime');

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh cache' 
      };
    }
  }

  /**
   * Map database status to employee status
   */
  private mapDatabaseStatusToEmployeeStatus(dbStatus: string): 'online' | 'break' | 'offline' {
    switch (dbStatus) {
      case 'online':
        return 'online';
      case 'break':
        return 'break';
      case 'offline':
      case 'away':
        return 'offline';
      default:
        return 'offline';
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    connectionId: string;
    reconnectAttempts: number;
    subscriptions: string[];
  } {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions.keys()),
    };
  }

  /**
   * Cleanup all subscriptions and intervals
   */
  cleanup(): void {
    console.log('🧹 Cleaning up real-time status service...');
    
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Remove all subscriptions
    this.subscriptions.forEach((subscription, key) => {
      try {
        supabase.removeChannel(subscription);
        console.log(`✅ Removed subscription: ${key}`);
      } catch (error) {
        console.error(`❌ Error removing subscription ${key}:`, error);
      }
    });

    this.subscriptions.clear();
    this.isConnected = false;
    
    // Notify server about disconnection
    this.notifyDisconnection();
    
    console.log('✅ Real-time status service cleanup completed');
  }

  /**
   * Notify server about disconnection
   */
  private async notifyDisconnection(): Promise<void> {
    try {
      await supabase.rpc('handle_connection_disconnect', {
        connection_id: this.connectionId,
      });
    } catch (error) {
      console.error('Error notifying disconnection:', error);
    }
  }
}

// Export singleton instance
export const realTimeStatusService = RealTimeStatusService.getInstance();