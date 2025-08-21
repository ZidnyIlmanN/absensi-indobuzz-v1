import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Employee } from '@/types';
import { Platform } from 'react-native';

export interface EmployeeStatus {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  avatarUrl?: string;
  currentStatus: 'online' | 'break' | 'offline' | 'away';
  lastActivity: Date;
  minutesInStatus: number;
  isConnected: boolean;
  locationAddress?: string;
  isManual: boolean;
}

export interface StatusUpdate {
  type: 'status_change' | 'heartbeat' | 'connection_status';
  employeeId: string;
  employeeName: string;
  oldStatus?: string;
  newStatus: string;
  timestamp: number;
  connectionId?: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface StatusStatistics {
  totalEmployees: number;
  onlineCount: number;
  breakCount: number;
  offlineCount: number;
  awayCount: number;
  connectedCount: number;
}

export interface RealTimeStatusOptions {
  onStatusUpdate?: (update: StatusUpdate) => void;
  onStatisticsUpdate?: (stats: StatusStatistics) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number; // in milliseconds
  enableDebugLogging?: boolean;
}

export class RealTimeStatusService {
  private static instance: RealTimeStatusService;
  private subscription: any = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionId: string;
  private isConnected = false;
  private options: RealTimeStatusOptions = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

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
   * Initialize real-time status tracking
   */
  async initialize(options: RealTimeStatusOptions = {}): Promise<void> {
    this.options = options;
    this.log('Initializing real-time status service...');

    try {
      await this.setupRealtimeSubscription();
      await this.initializeUserStatus();
      
      if (options.enableHeartbeat !== false) {
        this.startHeartbeat(options.heartbeatInterval || 30000); // 30 seconds default
      }

      this.log('Real-time status service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      this.log('Failed to initialize real-time status service:', errorMessage);
      this.options.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Setup Supabase realtime subscription
   */
  private async setupRealtimeSubscription(): Promise<void> {
    try {
      // Clean up existing subscription
      if (this.subscription) {
        await supabase.removeChannel(this.subscription);
      }

      this.subscription = supabase
        .channel('employee-status-realtime')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'employee_status',
          },
          (payload) => this.handleStatusUpdate(payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'employee_status',
          },
          (payload) => this.handleStatusUpdate(payload)
        )
        .on(
          'broadcast',
          { event: 'status_broadcast' },
          (payload) => this.handleBroadcastMessage(payload)
        )
        .subscribe((status) => {
          this.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.options.onConnectionChange?.(true);
          } else if (status === 'CLOSED') {
            this.isConnected = false;
            this.options.onConnectionChange?.(false);
            this.attemptReconnection();
          }
        });

      this.log('Realtime subscription setup complete');
    } catch (error) {
      this.log('Failed to setup realtime subscription:', error);
      throw error;
    }
  }

  /**
   * Handle status updates from database
   */
  private handleStatusUpdate(payload: any): void {
    try {
      const record = payload.new;
      
      this.log('Status update received:', {
        employeeId: record.user_id,
        status: record.status,
        lastActivity: record.last_activity,
      });

      // Get employee info and trigger callback
      this.getEmployeeInfo(record.user_id).then(employeeInfo => {
        if (employeeInfo) {
          const statusUpdate: StatusUpdate = {
            type: 'status_change',
            employeeId: record.user_id,
            employeeName: employeeInfo.name,
            oldStatus: payload.old?.status,
            newStatus: record.status,
            timestamp: Date.now(),
            connectionId: record.connection_id,
            location: record.location_address ? {
              address: record.location_address,
              latitude: parseFloat(record.location_lat || '0'),
              longitude: parseFloat(record.location_lng || '0'),
            } : undefined,
          };

          this.options.onStatusUpdate?.(statusUpdate);
        }
      });

      // Update statistics
      this.updateStatistics();
    } catch (error) {
      this.log('Error handling status update:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Status update error');
    }
  }

  /**
   * Handle broadcast messages
   */
  private handleBroadcastMessage(payload: any): void {
    try {
      this.log('Broadcast message received:', payload);
      
      if (payload.type === 'force_refresh') {
        this.updateStatistics();
      }
    } catch (error) {
      this.log('Error handling broadcast message:', error);
    }
  }

  /**
   * Get employee information
   */
  private async getEmployeeInfo(userId: string): Promise<{ name: string; employeeId: string } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, employee_id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        name: data.name,
        employeeId: data.employee_id,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize current user's status
   */
  private async initializeUserStatus(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Initialize or update user status
      const { error } = await supabase
        .from('employee_status')
        .upsert({
          user_id: user.id,
          status: 'online',
          last_activity: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
          connection_id: this.connectionId,
          device_info: {
            platform: Platform.OS,
            timestamp: Date.now(),
          },
        });

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      this.log('User status initialized');
    } catch (error) {
      this.log('Failed to initialize user status:', error);
      throw error;
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        this.log('Heartbeat failed:', error);
        this.options.onError?.(error instanceof Error ? error.message : 'Heartbeat failed');
      }
    }, interval);

    this.log(`Heartbeat started with ${interval}ms interval`);
  }

  /**
   * Send heartbeat to server
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_heartbeat', {
        connection_id: this.connectionId,
        device_info: {
          platform: Platform.OS,
          timestamp: Date.now(),
        },
      });

      if (error) {
        throw new Error(handleSupabaseError(error));
      }

      this.log('Heartbeat sent successfully');
    } catch (error) {
      this.log('Heartbeat error:', error);
      throw error;
    }
  }

  /**
   * Update statistics
   */
  private async updateStatistics(): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('get_status_statistics');

      if (error) {
        this.log('Failed to get statistics:', error);
        return;
      }

      if (data && data.length > 0) {
        const stats: StatusStatistics = {
          totalEmployees: data[0].total_employees,
          onlineCount: data[0].online_count,
          breakCount: data[0].break_count,
          offlineCount: data[0].offline_count,
          awayCount: data[0].away_count,
          connectedCount: data[0].connected_count,
        };

        this.options.onStatisticsUpdate?.(stats);
      }
    } catch (error) {
      this.log('Error updating statistics:', error);
    }
  }

  /**
   * Manually update employee status
   */
  async updateStatus(
    status: 'online' | 'break' | 'offline' | 'away',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase.rpc('update_employee_status', {
        target_user_id: user.id,
        new_status: status,
        reason: reason || 'Manual update',
      });

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      this.log(`Status updated to: ${status}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Status update failed';
      this.log('Status update error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current team status
   */
  async getTeamStatus(): Promise<{ 
    employees: EmployeeStatus[]; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_team_status');

      if (error) {
        return { employees: [], error: handleSupabaseError(error) };
      }

      const employees: EmployeeStatus[] = data.map((record: any) => ({
        employeeId: record.employee_id,
        employeeName: record.employee_name,
        employeeNumber: record.employee_number,
        department: record.department,
        position: record.position,
        avatarUrl: record.avatar_url,
        currentStatus: record.current_status,
        lastActivity: new Date(record.last_activity),
        minutesInStatus: record.minutes_in_status || 0,
        isConnected: record.is_connected,
        locationAddress: record.location_address,
        isManual: false, // This would come from the database
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
   * Get status statistics
   */
  async getStatistics(): Promise<{ 
    statistics: StatusStatistics | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_status_statistics');

      if (error) {
        return { statistics: null, error: handleSupabaseError(error) };
      }

      if (data && data.length > 0) {
        const statistics: StatusStatistics = {
          totalEmployees: data[0].total_employees,
          onlineCount: data[0].online_count,
          breakCount: data[0].break_count,
          offlineCount: data[0].offline_count,
          awayCount: data[0].away_count,
          connectedCount: data[0].connected_count,
        };

        return { statistics, error: null };
      }

      return { statistics: null, error: 'No statistics data available' };
    } catch (error) {
      return { 
        statistics: null, 
        error: error instanceof Error ? error.message : 'Failed to get statistics' 
      };
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      this.options.onError?.('Connection lost - max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.setupRealtimeSubscription();
        this.log('Reconnection successful');
      } catch (error) {
        this.log('Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, delay);
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup(): Promise<void> {
    this.log('Cleaning up real-time status service...');

    try {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Handle connection disconnect
      await supabase.rpc('handle_connection_disconnect', {
        connection_id: this.connectionId,
      });

      // Remove subscription
      if (this.subscription) {
        await supabase.removeChannel(this.subscription);
        this.subscription = null;
      }

      this.isConnected = false;
      this.options.onConnectionChange?.(false);
      
      this.log('Cleanup completed');
    } catch (error) {
      this.log('Error during cleanup:', error);
    }
  }

  /**
   * Force refresh of status data
   */
  async forceRefresh(): Promise<void> {
    try {
      // Refresh materialized view
      await supabase.rpc('refresh_employee_status_realtime');
      
      // Broadcast refresh to all clients
      await this.subscription?.send({
        type: 'broadcast',
        event: 'status_broadcast',
        payload: { type: 'force_refresh', timestamp: Date.now() },
      });

      this.log('Force refresh completed');
    } catch (error) {
      this.log('Force refresh failed:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Force refresh failed');
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    connectionId: string;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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