import { supabase } from '@/lib/supabase';
import { employeesService } from './employees';

export interface SyncDebugInfo {
  timestamp: Date;
  userId: string;
  userName: string;
  expectedStatus: string;
  actualStatus: string;
  attendanceRecord: any;
  syncLatency: number;
  errors: string[];
}

export class StatusSyncDebugger {
  private static instance: StatusSyncDebugger;
  private debugLogs: SyncDebugInfo[] = [];
  private maxLogs = 100;

  public static getInstance(): StatusSyncDebugger {
    if (!StatusSyncDebugger.instance) {
      StatusSyncDebugger.instance = new StatusSyncDebugger();
    }
    return StatusSyncDebugger.instance;
  }

  /**
   * Test status synchronization for a specific user
   */
  async testUserStatusSync(userId: string): Promise<SyncDebugInfo> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      console.log(`🔍 Testing status sync for user: ${userId}`);
      
      // Step 1: Get current attendance record
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceRecord, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (attendanceError) {
        errors.push(`Attendance query error: ${attendanceError.message}`);
      }

      // Step 2: Get employee data through service
      const { employee, error: employeeError } = await employeesService.getEmployeeById(userId);
      
      if (employeeError) {
        errors.push(`Employee service error: ${employeeError}`);
      }

      // Step 3: Determine expected vs actual status
      let expectedStatus = 'offline';
      if (attendanceRecord) {
        switch (attendanceRecord.status) {
          case 'working':
          case 'overtime':
          case 'client_visit':
            expectedStatus = 'online';
            break;
          case 'break':
            expectedStatus = 'break';
            break;
          case 'completed':
            expectedStatus = 'offline';
            break;
        }
      }

      const actualStatus = employee?.status || 'unknown';
      const syncLatency = Date.now() - startTime;

      const debugInfo: SyncDebugInfo = {
        timestamp: new Date(),
        userId,
        userName: employee?.name || 'Unknown',
        expectedStatus,
        actualStatus,
        attendanceRecord,
        syncLatency,
        errors,
      };

      // Log the result
      if (expectedStatus !== actualStatus) {
        console.warn(`❌ Status mismatch for ${debugInfo.userName}:`, {
          expected: expectedStatus,
          actual: actualStatus,
          latency: `${syncLatency}ms`,
        });
      } else {
        console.log(`✅ Status sync correct for ${debugInfo.userName}:`, {
          status: actualStatus,
          latency: `${syncLatency}ms`,
        });
      }

      this.addDebugLog(debugInfo);
      return debugInfo;
    } catch (error) {
      const debugInfo: SyncDebugInfo = {
        timestamp: new Date(),
        userId,
        userName: 'Error',
        expectedStatus: 'unknown',
        actualStatus: 'error',
        attendanceRecord: null,
        syncLatency: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };

      this.addDebugLog(debugInfo);
      return debugInfo;
    }
  }

  /**
   * Test synchronization for all active employees
   */
  async testAllEmployeesSync(): Promise<SyncDebugInfo[]> {
    console.log('🔍 Testing status sync for all employees...');
    
    try {
      const { employees, error } = await employeesService.getAllEmployees({
        includeInactive: false,
        limit: 50,
      });

      if (error) {
        console.error('Failed to get employees for sync test:', error);
        return [];
      }

      const results = await Promise.all(
        employees.map(emp => this.testUserStatusSync(emp.id))
      );

      // Summary
      const mismatches = results.filter(r => r.expectedStatus !== r.actualStatus);
      const avgLatency = results.reduce((sum, r) => sum + r.syncLatency, 0) / results.length;

      console.log('📊 Sync test summary:', {
        totalEmployees: results.length,
        mismatches: mismatches.length,
        averageLatency: `${Math.round(avgLatency)}ms`,
        successRate: `${Math.round(((results.length - mismatches.length) / results.length) * 100)}%`,
      });

      if (mismatches.length > 0) {
        console.warn('❌ Status mismatches found:', mismatches.map(m => ({
          name: m.userName,
          expected: m.expectedStatus,
          actual: m.actualStatus,
        })));
      }

      return results;
    } catch (error) {
      console.error('Sync test failed:', error);
      return [];
    }
  }

  /**
   * Monitor real-time sync performance
   */
  startPerformanceMonitoring(intervalMs: number = 60000): () => void {
    console.log('📈 Starting real-time sync performance monitoring...');
    
    const interval = setInterval(async () => {
      const results = await this.testAllEmployeesSync();
      
      if (results.length > 0) {
        const issues = results.filter(r => 
          r.expectedStatus !== r.actualStatus || 
          r.errors.length > 0 || 
          r.syncLatency > 5000
        );

        if (issues.length > 0) {
          console.warn(`⚠️ Sync performance issues detected: ${issues.length}/${results.length} employees`);
          
          // Trigger force refresh if too many issues
          if (issues.length > results.length * 0.3) {
            console.log('🔄 Triggering force refresh due to sync issues...');
            await this.forceRefreshAllEmployees();
          }
        }
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
      console.log('📈 Stopped performance monitoring');
    };
  }

  /**
   * Force refresh all employee data
   */
  async forceRefreshAllEmployees(): Promise<void> {
    try {
      console.log('🔄 Force refreshing all employee data...');
      
      const { employees, error } = await employeesService.getAllEmployees({
        includeInactive: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      
      if (error) {
        console.error('Force refresh failed:', error);
        return;
      }

      console.log(`✅ Force refresh completed for ${employees.length} employees`);
    } catch (error) {
      console.error('Force refresh error:', error);
    }
  }

  /**
   * Get debug logs
   */
  getDebugLogs(): SyncDebugInfo[] {
    return [...this.debugLogs].reverse(); // Most recent first
  }

  /**
   * Clear debug logs
   */
  clearDebugLogs(): void {
    this.debugLogs = [];
    console.log('🗑️ Debug logs cleared');
  }

  /**
   * Add debug log entry
   */
  private addDebugLog(info: SyncDebugInfo): void {
    this.debugLogs.push(info);
    
    // Keep only the most recent logs
    if (this.debugLogs.length > this.maxLogs) {
      this.debugLogs = this.debugLogs.slice(-this.maxLogs);
    }
  }

  /**
   * Export debug report
   */
  exportDebugReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalLogs: this.debugLogs.length,
      recentIssues: this.debugLogs
        .filter(log => log.expectedStatus !== log.actualStatus || log.errors.length > 0)
        .slice(-10),
      performanceStats: {
        averageLatency: this.debugLogs.reduce((sum, log) => sum + log.syncLatency, 0) / this.debugLogs.length,
        errorRate: this.debugLogs.filter(log => log.errors.length > 0).length / this.debugLogs.length,
        syncAccuracy: this.debugLogs.filter(log => log.expectedStatus === log.actualStatus).length / this.debugLogs.length,
      },
    };

    return JSON.stringify(report, null, 2);
  }
}

// Convenience instance
export const statusSyncDebugger = StatusSyncDebugger.getInstance();