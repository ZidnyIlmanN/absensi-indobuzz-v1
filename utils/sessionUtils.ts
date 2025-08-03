import { AppState, AppStateStatus } from 'react-native';
import { sessionManager } from '@/services/sessionManager';

export interface SessionMonitorOptions {
  onSessionExpired?: () => void;
  onSessionRefreshed?: () => void;
  onSessionError?: (error: string) => void;
}

export class SessionMonitor {
  private static instance: SessionMonitor;
  private appStateSubscription: any = null;
  private options: SessionMonitorOptions = {};

  public static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) {
      SessionMonitor.instance = new SessionMonitor();
    }
    return SessionMonitor.instance;
  }

  /**
   * Start monitoring app state and session validity
   */
  startMonitoring(options: SessionMonitorOptions = {}): void {
    this.options = options;
    
    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    console.log('Session monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    console.log('Session monitoring stopped');
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      await this.checkSessionOnAppResume();
    }
  };

  /**
   * Check session validity when app becomes active
   */
  private async checkSessionOnAppResume(): Promise<void> {
    try {
      const sessionResult = await sessionManager.getStoredSession();
      
      if (!sessionResult.isValid) {
        console.log('Session invalid on app resume');
        this.options.onSessionExpired?.();
        return;
      }

      if (sessionResult.needsRefresh) {
        console.log('Session needs refresh on app resume');
        const refreshResult = await sessionManager.refreshSession();
        
        if (refreshResult.success) {
          console.log('Session refreshed successfully');
          this.options.onSessionRefreshed?.();
        } else {
          console.log('Session refresh failed');
          this.options.onSessionError?.(refreshResult.error || 'Session refresh failed');
        }
      }
    } catch (error) {
      console.error('Error checking session on app resume:', error);
      this.options.onSessionError?.(
        error instanceof Error ? error.message : 'Session check error'
      );
    }
  }

  /**
   * Force session validation
   */
  async validateSession(): Promise<boolean> {
    try {
      const result = await sessionManager.getStoredSession();
      return result.isValid;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Get session info for debugging
   */
  async getSessionInfo(): Promise<{
    hasSession: boolean;
    isValid: boolean;
    needsRefresh: boolean;
    lastLogin: number | null;
  }> {
    try {
      const sessionResult = await sessionManager.getStoredSession();
      const lastLogin = await sessionManager.getLastLoginTime();
      
      return {
        hasSession: !!sessionResult,
        isValid: sessionResult.isValid,
        needsRefresh: sessionResult.needsRefresh,
        lastLogin,
      };
    } catch (error) {
      return {
        hasSession: false,
        isValid: false,
        needsRefresh: false,
        lastLogin: null,
      };
    }
  }
}

// Convenience instance
export const sessionMonitor = SessionMonitor.getInstance();

/**
 * Hook for session monitoring in React components
 */
export const useSessionMonitor = (options: SessionMonitorOptions = {}) => {
  const monitor = SessionMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.startMonitoring(options);
    
    return () => {
      monitor.stopMonitoring();
    };
  }, []);
  
  return {
    validateSession: () => monitor.validateSession(),
    getSessionInfo: () => monitor.getSessionInfo(),
  };
};