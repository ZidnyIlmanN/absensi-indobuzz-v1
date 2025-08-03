import { secureStorage, STORAGE_KEYS } from './secureStorage';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

interface SessionValidationResult {
  isValid: boolean;
  user: User | null;
  needsRefresh: boolean;
  error?: string;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh if expires in 10 minutes

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Save session data securely after successful login
   */
  async saveSession(sessionData: SessionData): Promise<void> {
    try {
      const sessionPayload = {
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresAt: sessionData.expiresAt,
        user: sessionData.user,
        savedAt: Date.now(),
      };

      await Promise.all([
        secureStorage.setSecureItem(
          STORAGE_KEYS.USER_SESSION, 
          JSON.stringify(sessionPayload),
          { requireAuthentication: false } // Don't require biometric for session data
        ),
        secureStorage.setSecureItem(STORAGE_KEYS.LAST_LOGIN, Date.now().toString()),
      ]);

      console.log('Session saved successfully');
      this.startSessionMonitoring();
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session data');
    }
  }

  /**
   * Retrieve and validate stored session
   */
  async getStoredSession(): Promise<SessionValidationResult> {
    try {
      const sessionData = await secureStorage.getSecureItem(STORAGE_KEYS.USER_SESSION);
      
      if (!sessionData) {
        return {
          isValid: false,
          user: null,
          needsRefresh: false,
          error: 'No stored session found',
        };
      }

      const parsedSession = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session is expired
      if (now >= parsedSession.expiresAt) {
        console.log('Stored session is expired');
        return {
          isValid: false,
          user: null,
          needsRefresh: true,
          error: 'Session expired',
        };
      }

      // Check if session needs refresh soon
      const needsRefresh = (parsedSession.expiresAt - now) < this.TOKEN_REFRESH_THRESHOLD;

      // Validate session with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(parsedSession.accessToken);
      
      if (error || !user) {
        console.log('Session validation failed:', error);
        await this.clearSession();
        return {
          isValid: false,
          user: null,
          needsRefresh: true,
          error: 'Session validation failed',
        };
      }

      console.log('Session validated successfully');
      return {
        isValid: true,
        user: parsedSession.user,
        needsRefresh,
      };
    } catch (error) {
      console.error('Error validating stored session:', error);
      await this.clearSession();
      return {
        isValid: false,
        user: null,
        needsRefresh: false,
        error: 'Session validation error',
      };
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Attempting to refresh session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Session refresh failed:', error);
        await this.clearSession();
        return { success: false, error: error?.message || 'Failed to refresh session' };
      }

      // Save the new session
      const newSessionData: SessionData = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: Date.now() + (data.session.expires_in * 1000),
        user: data.session.user as any, // You might need to fetch full user profile
      };

      await this.saveSession(newSessionData);
      console.log('Session refreshed successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Error refreshing session:', error);
      await this.clearSession();
      return { success: false, error: 'Session refresh error' };
    }
  }

  /**
   * Clear stored session data
   */
  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        secureStorage.removeSecureItem(STORAGE_KEYS.USER_SESSION),
        secureStorage.removeSecureItem(STORAGE_KEYS.LAST_LOGIN),
      ]);
      
      this.stopSessionMonitoring();
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if user has a valid stored session
   */
  async hasValidSession(): Promise<boolean> {
    const result = await this.getStoredSession();
    return result.isValid;
  }

  /**
   * Get last login timestamp
   */
  async getLastLoginTime(): Promise<number | null> {
    try {
      const lastLogin = await secureStorage.getSecureItem(STORAGE_KEYS.LAST_LOGIN);
      return lastLogin ? parseInt(lastLogin, 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Start monitoring session validity
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      const result = await this.getStoredSession();
      
      if (!result.isValid && result.needsRefresh) {
        console.log('Session expired, attempting refresh...');
        const refreshResult = await this.refreshSession();
        
        if (!refreshResult.success) {
          console.log('Session refresh failed, user needs to login again');
          // You might want to emit an event here to notify the app
          this.stopSessionMonitoring();
        }
      }
    }, this.SESSION_CHECK_INTERVAL);
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Initialize session manager
   */
  async initialize(): Promise<SessionValidationResult> {
    console.log('Initializing session manager...');
    const result = await this.getStoredSession();
    
    if (result.isValid) {
      this.startSessionMonitoring();
      
      // Auto-refresh if needed
      if (result.needsRefresh) {
        console.log('Session needs refresh, refreshing...');
        await this.refreshSession();
      }
    }
    
    return result;
  }

  /**
   * Cleanup when app is closing
   */
  cleanup(): void {
    this.stopSessionMonitoring();
  }
}

// Convenience instance
export const sessionManager = SessionManager.getInstance();