import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';

export interface RealTimeSyncOptions {
  onEmployeeStatusChange?: (employee: Employee) => void;
  onAttendanceUpdate?: (attendanceData: any) => void;
  onError?: (error: string) => void;
  enableDebugLogging?: boolean;
}

export class RealTimeSyncService {
  private static instance: RealTimeSyncService;
  private subscriptions: Map<string, any> = new Map();
  private options: RealTimeSyncOptions = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  public static getInstance(): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      RealTimeSyncService.instance = new RealTimeSyncService();
    }
    return RealTimeSyncService.instance;
  }

  /**
   * Initialize real-time synchronization
   */
  initialize(options: RealTimeSyncOptions = {}): void {
    this.options = { enableDebugLogging: true, ...options };
    this.log('Initializing real-time sync service...');
    
    this.setupEmployeeStatusSync();
    this.setupConnectionMonitoring();
  }

  /**
   * Set up employee status synchronization
   */
  private setupEmployeeStatusSync(): void {
    this.log('Setting up employee status synchronization...');
    
    const channelName = 'employee-status-sync';
    
    // Remove existing subscription if any
    this.removeSubscription(channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          this.handleAttendanceChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          this.handleProfileChange(payload);
        }
      )
      .subscribe((status) => {
        this.log(`Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.log('✅ Real-time sync connected successfully');
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          this.log('❌ Real-time sync connection failed');
          this.handleConnectionError();
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          this.log('🔌 Real-time sync connection closed');
        }
      });

    this.subscriptions.set(channelName, channel);
  }

  /**
   * Handle attendance record changes
   */
  private async handleAttendanceChange(payload: any): Promise<void> {
    try {
      const userId = payload.new?.user_id || payload.old?.user_id;
      const attendanceRecord = payload.new || payload.old;
      
      this.log('Processing attendance change:', {
        event: payload.eventType,
        table: payload.table,
        userId: userId,
        status: attendanceRecord?.status,
        date: attendanceRecord?.date,
      });

      if (!attendanceRecord?.user_id) return;

      // Get updated employee data
      const { employeesService } = await import('./employees');
      const { employee, error } = await employeesService.getEmployeeById(attendanceRecord.user_id);
      
      if (error) {
        this.log('Failed to get updated employee data:', error);
        this.options.onError?.(error);
        return;
      }

      if (employee) {
        this.log(`🔄 Employee ${employee.name} status updated to: ${employee.status} (from attendance change)`);
        this.options.onEmployeeStatusChange?.(employee);
        this.options.onAttendanceUpdate?.(attendanceRecord);
        
        // Broadcast to attendance sync service
        const { attendanceSyncService } = await import('./attendanceSync');
        attendanceSyncService.broadcastAttendanceEvent({
          type: 'status_change',
          userId: employee.id,
          attendanceId: attendanceRecord.id,
          newStatus: employee.status,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.log('Error handling attendance change:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle profile changes
   */
  private async handleProfileChange(payload: any): Promise<void> {
    try {
      this.log('Processing profile change:', {
        event: payload.eventType,
        userId: payload.new?.id || payload.old?.id,
      });

      const profile = payload.new || payload.old;
      if (!profile?.id) return;

      // Get updated employee data
      const { employeesService } = await import('./employees');
      const { employee, error } = await employeesService.getEmployeeById(profile.id);
      
      if (error) {
        this.log('Failed to get updated employee data after profile change:', error);
        return;
      }

      if (employee) {
        this.log(`Employee ${employee.name} profile updated`);
        this.options.onEmployeeStatusChange?.(employee);
      }
    } catch (error) {
      this.log('Error handling profile change:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Set up connection monitoring and auto-reconnect
   */
  private setupConnectionMonitoring(): void {
    // Monitor connection status every 30 seconds
    setInterval(() => {
      if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.log('Connection lost, attempting to reconnect...');
        this.reconnect();
      }
    }, 30000);
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnect();
      }, delay);
    } else {
      this.log('Max reconnection attempts reached');
      this.options.onError?.('Real-time sync connection failed after multiple attempts');
    }
  }

  /**
   * Reconnect to real-time services
   */
  private reconnect(): void {
    this.reconnectAttempts++;
    this.cleanup();
    this.setupEmployeeStatusSync();
  }

  /**
   * Remove a specific subscription
   */
  private removeSubscription(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
      this.log(`Removed subscription: ${channelName}`);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    activeSubscriptions: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      activeSubscriptions: this.subscriptions.size,
    };
  }

  /**
   * Force refresh all employee data
   */
  async forceRefresh(): Promise<void> {
    this.log('Force refreshing all employee data...');
    
    try {
      const { employeesService } = await import('./employees');
      const { employees, error } = await employeesService.getAllEmployees({
        includeInactive: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      
      if (error) {
        this.options.onError?.(error);
        return;
      }

      // Notify about all employees to trigger UI updates
      employees.forEach(employee => {
        this.options.onEmployeeStatusChange?.(employee);
      });
      
      this.log(`Force refresh completed for ${employees.length} employees`);
    } catch (error) {
      this.log('Force refresh failed:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Force refresh failed');
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.log('Cleaning up real-time sync service...');
    
    this.subscriptions.forEach((subscription, channelName) => {
      supabase.removeChannel(subscription);
      this.log(`Cleaned up subscription: ${channelName}`);
    });
    
    this.subscriptions.clear();
    this.isConnected = false;
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.options.enableDebugLogging) {
      if (data) {
        console.log(`[RealTimeSync] ${message}`, data);
      } else {
        console.log(`[RealTimeSync] ${message}`);
      }
    }
  }
}

// Convenience instance
export const realTimeSyncService = RealTimeSyncService.getInstance();