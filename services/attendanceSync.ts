import { supabase } from '@/lib/supabase';
import { AttendanceRecord } from '@/types';

export interface AttendanceSyncEvent {
  type: 'clock_in' | 'clock_out' | 'status_change' | 'break_start' | 'break_end';
  userId: string;
  attendanceId: string;
  newStatus: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export class AttendanceSyncService {
  private static instance: AttendanceSyncService;
  private eventListeners: Map<string, (event: AttendanceSyncEvent) => void> = new Map();
  private syncQueue: AttendanceSyncEvent[] = [];
  private isProcessingQueue = false;
  private debugMode = true; // Enable debug logging

  public static getInstance(): AttendanceSyncService {
    if (!AttendanceSyncService.instance) {
      AttendanceSyncService.instance = new AttendanceSyncService();
    }
    return AttendanceSyncService.instance;
  }

  /**
   * Broadcast attendance event to all listeners
   */
  broadcastAttendanceEvent(event: AttendanceSyncEvent): void {
    if (this.debugMode) {
      console.log('📡 Broadcasting attendance event:', {
        type: event.type,
        userId: event.userId,
        newStatus: event.newStatus,
        listenerCount: this.eventListeners.size,
        timestamp: event.timestamp.toISOString()
      });
    }
    
    // Add to sync queue for processing
    this.syncQueue.push(event);
    this.processQueue();
    
    // Notify all listeners immediately
    this.eventListeners.forEach((listener, listenerId) => {
      try {
        if (this.debugMode) {
          console.log(`📤 Notifying listener ${listenerId} of event ${event.type}`);
        }
        listener(event);
      } catch (error) {
        console.error(`❌ Error in listener ${listenerId}:`, error);
      }
    });
    
    if (this.debugMode) {
      console.log(`✅ Event broadcast complete to ${this.eventListeners.size} listeners`);
    }
  }

  /**
   * Subscribe to attendance events
   */
  subscribe(listenerId: string, callback: (event: AttendanceSyncEvent) => void): () => void {
    if (this.debugMode) {
      console.log(`🔗 New subscription: ${listenerId}`);
    }
    
    this.eventListeners.set(listenerId, callback);
    
    if (this.debugMode) {
      console.log(`📊 Total listeners: ${this.eventListeners.size}`);
    }
    
    return () => {
      if (this.debugMode) {
        console.log(`🔌 Unsubscribing: ${listenerId}`);
      }
      this.eventListeners.delete(listenerId);
    };
  }

  /**
   * Process sync queue to ensure all events are handled
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const event = this.syncQueue.shift();
        if (event) {
          await this.processAttendanceEvent(event);
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process individual attendance event
   */
  private async processAttendanceEvent(event: AttendanceSyncEvent): Promise<void> {
    try {
      console.log('Processing attendance event:', event.type, event.userId);
      
      // Update local cache or trigger refresh
      switch (event.type) {
        case 'clock_in':
        case 'clock_out':
        case 'status_change':
          await this.syncEmployeeStatus(event.userId);
          break;
        case 'break_start':
        case 'break_end':
          await this.syncEmployeeBreakStatus(event.userId);
          break;
      }
    } catch (error) {
      console.error('Error processing attendance event:', error);
    }
  }

  /**
   * Sync employee status after attendance change
   */
  private async syncEmployeeStatus(userId: string): Promise<void> {
    try {
      // Force refresh employee data from database
      const { employeesService } = await import('./employees');
      const { employee, error } = await employeesService.getEmployeeById(userId);
      
      if (error) {
        console.error('Failed to sync employee status:', error);
        return;
      }

      if (employee) {
        console.log(`Synced employee ${employee.name} status: ${employee.status}`);
        
        // Broadcast updated employee data
        this.broadcastEmployeeUpdate(employee);
      }
    } catch (error) {
      console.error('Error syncing employee status:', error);
    }
  }

  /**
   * Sync employee break status
   */
  private async syncEmployeeBreakStatus(userId: string): Promise<void> {
    // Similar to syncEmployeeStatus but specifically for break status changes
    await this.syncEmployeeStatus(userId);
  }

  /**
   * Broadcast employee update to all components
   */
  private broadcastEmployeeUpdate(employee: any): void {
    console.log('Broadcasting employee update:', employee.name, employee.status);
    
    const updateEvent: AttendanceSyncEvent = {
      type: 'status_change',
      userId: employee.id,
      attendanceId: employee.currentAttendance?.id || '',
      newStatus: employee.status,
      timestamp: new Date(),
    };

    // Notify listeners about the employee update
    this.eventListeners.forEach((listener, listenerId) => {
      try {
        console.log(`Notifying listener ${listenerId} about employee update`);
        listener(updateEvent);
      } catch (error) {
        console.error(`Error broadcasting employee update to listener ${listenerId}:`, error);
      }
    });
    
    // Also trigger a global employee status update event
    this.triggerGlobalEmployeeUpdate(employee);
  }

  /**
   * Trigger global employee status update for all components
   */
  private triggerGlobalEmployeeUpdate(employee: any): void {
    // Create a custom event that can be listened to by any component
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('employeeStatusUpdate', {
        detail: { employee }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Get sync queue status for debugging
   */
  getSyncStatus(): {
    queueLength: number;
    isProcessing: boolean;
    listenerCount: number;
  } {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessingQueue,
      listenerCount: this.eventListeners.size,
    };
  }

  /**
   * Clear sync queue (for debugging)
   */
  clearQueue(): void {
    this.syncQueue = [];
    console.log('Sync queue cleared');
  }
}

// Convenience instance
export const attendanceSyncService = AttendanceSyncService.getInstance();