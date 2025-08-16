/**
 * Real-time debugging utilities for troubleshooting sync issues
 */

import { supabase } from '@/lib/supabase';

export interface RealTimeDebugInfo {
  supabaseConnection: {
    connected: boolean;
    url: string;
    key: string;
  };
  subscriptions: {
    active: number;
    channels: string[];
    status: { [channel: string]: string };
  };
  lastEvents: {
    timestamp: Date;
    type: string;
    table: string;
    data: any;
  }[];
  networkStatus: {
    online: boolean;
    effectiveType?: string;
  };
}

export class RealTimeDebugger {
  private static instance: RealTimeDebugger;
  private eventLog: any[] = [];
  private maxLogSize = 50;

  public static getInstance(): RealTimeDebugger {
    if (!RealTimeDebugger.instance) {
      RealTimeDebugger.instance = new RealTimeDebugger();
    }
    return RealTimeDebugger.instance;
  }

  /**
   * Start debugging real-time events
   */
  startDebugging(): void {
    console.log('🐛 Starting real-time debugging...');
    
    // Log all Supabase real-time events
    this.setupEventLogging();
    
    // Monitor network status
    this.monitorNetworkStatus();
  }

  /**
   * Setup event logging for all real-time events
   */
  private setupEventLogging(): void {
    // Override console.log to capture real-time events
    const originalLog = console.log;
    console.log = (...args) => {
      // Check if this is a real-time event
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('Real-time') || arg.includes('postgres_changes'))
      )) {
        this.logEvent('console', 'real-time', args);
      }
      originalLog.apply(console, args);
    };
  }

  /**
   * Monitor network status changes
   */
  private monitorNetworkStatus(): void {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      window.addEventListener('online', () => {
        this.logEvent('network', 'online', { status: 'online' });
      });
      
      window.addEventListener('offline', () => {
        this.logEvent('network', 'offline', { status: 'offline' });
      });
    }
  }

  /**
   * Log real-time events
   */
  private logEvent(source: string, type: string, data: any): void {
    const event = {
      timestamp: new Date(),
      source,
      type,
      data,
    };

    this.eventLog.push(event);
    
    // Keep only recent events
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    console.log(`[RealTimeDebug] ${source}:${type}`, data);
  }

  /**
   * Get comprehensive debug information
   */
  async getDebugInfo(): Promise<RealTimeDebugInfo> {
    try {
      // Test Supabase connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      // Get network status
      const networkStatus = {
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        effectiveType: typeof navigator !== 'undefined' && 'connection' in navigator 
          ? (navigator as any).connection?.effectiveType 
          : undefined,
      };

      return {
        supabaseConnection: {
          connected: !connectionError,
          url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not configured',
          key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured',
        },
        subscriptions: {
          active: 0, // Would need to track active subscriptions
          channels: [], // Would need to track active channels
          status: {}, // Would need to track channel statuses
        },
        lastEvents: this.eventLog.slice(-10), // Last 10 events
        networkStatus,
      };
    } catch (error) {
      console.error('Error getting debug info:', error);
      throw error;
    }
  }

  /**
   * Test real-time functionality
   */
  async testRealTimeConnection(): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      // Create a test subscription
      const testChannel = supabase
        .channel('debug-test-channel')
        .on('broadcast', { event: 'test' }, (payload) => {
          const latency = Date.now() - startTime;
          console.log('Real-time test successful, latency:', latency + 'ms');
        })
        .subscribe();

      // Send test message
      await testChannel.send({
        type: 'broadcast',
        event: 'test',
        payload: { test: true, timestamp: startTime },
      });

      // Cleanup
      setTimeout(() => {
        supabase.removeChannel(testChannel);
      }, 5000);

      return { success: true, latency: Date.now() - startTime };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Real-time test failed',
      };
    }
  }

  /**
   * Simulate status update for testing
   */
  async simulateStatusUpdate(employeeId: string, newStatus: 'online' | 'break' | 'offline'): Promise<void> {
    try {
      console.log(`🧪 Simulating status update: ${employeeId} -> ${newStatus}`);
      
      // Emit a fake status update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('employeeStatusUpdate', {
          detail: {
            employeeId,
            status: newStatus,
            timestamp: new Date(),
            source: 'simulation',
          }
        }));
      }
      
      this.logEvent('simulation', 'status_update', {
        employeeId,
        newStatus,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error simulating status update:', error);
    }
  }

  /**
   * Get event log for debugging
   */
  getEventLog(): any[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = [];
    console.log('🧹 Real-time event log cleared');
  }

  /**
   * Stop debugging
   */
  stopDebugging(): void {
    console.log('🛑 Stopping real-time debugging...');
    this.clearEventLog();
  }
}

// Convenience instance
export const realTimeDebugger = RealTimeDebugger.getInstance();

/**
 * Hook for real-time debugging in components
 */
export const useRealTimeDebugger = () => {
  const debugger = RealTimeDebugger.getInstance();
  
  React.useEffect(() => {
    if (__DEV__) {
      debugger.startDebugging();
    }
    
    return () => {
      debugger.stopDebugging();
    };
  }, []);

  return {
    getDebugInfo: () => debugger.getDebugInfo(),
    testConnection: () => debugger.testRealTimeConnection(),
    simulateStatusUpdate: (employeeId: string, status: 'online' | 'break' | 'offline') =>
      debugger.simulateStatusUpdate(employeeId, status),
    getEventLog: () => debugger.getEventLog(),
    clearEventLog: () => debugger.clearEventLog(),
  };
};