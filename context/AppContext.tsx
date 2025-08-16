import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, AttendanceRecord, Request, Notification, Employee, ActivityRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/userAttendance';
import { useNotifications } from '@/hooks/useNotifications';
import { useRequests } from '@/hooks/useRequests';
import { sessionMonitor } from '@/utils/sessionUtils';
import { realTimeSyncService } from '@/services/realTimeSync';

interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>;
  
  // Attendance
  currentAttendance: AttendanceRecord | null;
  todayActivities: ActivityRecord[];
  attendanceHistory: AttendanceRecord[];
  clockIn: (location: { latitude: number; longitude: number; address: string }, selfieUrl?: string) => Promise<{ error: string | null }>;
  clockOut: (selfieUrl?: string, notes?: string) => Promise<{ error: string | null }>;
  addActivity: (type: ActivityRecord['type'], location?: { latitude: number; longitude: number; address: string }, notes?: string) => Promise<{ error: string | null }>;
  updateAttendanceStatus: (status: AttendanceRecord['status']) => Promise<{ error: string | null }>;
  
  // Requests
  requests: Request[];
  createRequest: (type: Request['type'], title: string, description: string, options?: any) => Promise<{ error: string | null }>;
  
  // Notifications
  notifications: Notification[];
  unreadNotifications: number;
  markNotificationAsRead: (id: string) => Promise<{ error: string | null }>;
  markAllNotificationsAsRead: () => Promise<{ error: string | null }>;
  deleteNotification: (id: string) => Promise<{ error: string | null }>;
  
  // UI State
  isWorking: boolean;
  currentStatus: 'ready' | 'working' | 'break' | 'overtime' | 'client_visit';
  setCurrentStatus: (status: 'ready' | 'working' | 'break' | 'overtime' | 'client_visit') => void;
  workHours: string;
  breakTime: string;
  overtimeHours: string;
  clientVisitTime: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Auth hooks
  const auth = useAuth();
  const { t } = useTranslation();
  
  // Data hooks
  const attendance = useAttendance(auth.user?.id || null);
  const notifications = useNotifications(auth.user?.id || null);
  const requests = useRequests(auth.user?.id || null);
  
  // UI state
  const [uiState, setUiState] = useState({
    workHours: '00:00',
    breakTime: '00:00', // Initialize breakTime
    overtimeHours: '00:00',
    clientVisitTime: '00:00',
    currentStatus: 'ready' as 'working' | 'break' | 'ready' | 'overtime' | 'client_visit',
  }); 
  const setCurrentStatus = (status: 'ready' | 'working' | 'break' | 'overtime' | 'client_visit') => {
    setUiState(prev => ({ ...prev, currentStatus: status }));
  }; // This function is correctly setting the currentStatus

  // Initialize session monitoring
  useEffect(() => {
    let timeoutId: any = null;
    
    try {
      if (auth.isAuthenticated) {
        // Initialize real-time sync service
        realTimeSyncService.initialize({
          onEmployeeStatusChange: (employee) => {
            console.log('Employee status changed in real-time:', employee.name, employee.status);
            // Force refresh employee data when status changes
            // This ensures all components get the latest data
          },
          onAttendanceUpdate: (attendanceData) => {
            console.log('Attendance updated in real-time:', attendanceData);
          },
          onError: (error) => {
            console.error('Real-time sync error:', error);
          },
          enableDebugLogging: true,
        });
        
        sessionMonitor.startMonitoring({
          onSessionExpired: () => {
            console.log('Session expired, redirecting to login');
            auth.signOut();
          },
          onSessionRefreshed: () => {
            console.log('Session refreshed successfully');
          },
          onSessionError: (error) => {
            console.error('Session error:', error);
          },
        });
      } else {
        sessionMonitor.stopMonitoring();
        realTimeSyncService.cleanup();
      }
    } catch (sessionError) {
      console.error('Session monitoring error:', sessionError);
    }

    // Add timeout to prevent indefinite session monitoring initialization
    timeoutId = setTimeout(() => {
      console.warn('Session monitoring initialization timeout');
    }, 5000); // 5 seconds timeout

    return () => {
      try {
        sessionMonitor.stopMonitoring();
        realTimeSyncService.cleanup();
      } catch (error) {
        console.error('Error stopping session monitoring:', error);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [auth.isAuthenticated]);
  // Calculate real-time work hours
  useEffect(() => {
    if (!attendance.currentAttendance?.clockIn || attendance.currentAttendance.status === 'completed') return;

    const timer = setInterval(() => {
      const now = new Date();
      const clockInTime = attendance.currentAttendance!.clockIn.getTime();
      
      let totalWorkTime = 0;
      let totalBreakTime = 0;
      let totalOvertimeTime = 0;
      let totalClientVisitTime = 0;
      
      // Calculate time based on activities
      const activities = [...attendance.todayActivities].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      let currentActivityStart = clockInTime;
      let currentActivityType: 'working' | 'break' | 'overtime' | 'client_visit' = 'working';
      
      // Process all completed activities
      for (const activity of activities) {
        const activityTime = activity.timestamp.getTime();
        const duration = activityTime - currentActivityStart;
        
        // Add duration to appropriate category
        switch (currentActivityType) {
          case 'working':
            totalWorkTime += duration;
            break;
          case 'break':
            totalBreakTime += duration;
            break;
          case 'overtime':
            totalOvertimeTime += duration;
            break;
          case 'client_visit':
            totalClientVisitTime += duration;
            break;
        }
        
        // Update current activity type based on activity
          switch (activity.type) {
            case 'break_start':
              currentActivityType = 'break';
              break;
            case 'break_end':
            case 'overtime_end':
            case 'client_visit_end':
              currentActivityType = 'working';
              break;
            case 'overtime_start':
              currentActivityType = 'overtime';
              break;
            case 'client_visit_start':
              currentActivityType = 'client_visit';
              break;
          }
        
        currentActivityStart = activityTime;
      }
      
      // Add current ongoing activity time
      const currentDuration = now.getTime() - currentActivityStart;
      switch (currentActivityType) {
        case 'working':
          totalWorkTime += currentDuration;
          break;
        case 'break':
          totalBreakTime += currentDuration;
          break;
        case 'overtime':
          totalOvertimeTime += currentDuration;
          break;
        case 'client_visit':
          totalClientVisitTime += currentDuration;
          break;
      }
      
      // Convert to readable format
      const formatTime = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };
      
      setUiState(prev => ({
        ...prev,
        workHours: formatTime(totalWorkTime),
        breakTime: formatTime(totalBreakTime),
        overtimeHours: formatTime(totalOvertimeTime),
        clientVisitTime: formatTime(totalClientVisitTime),
        currentStatus: currentActivityType,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [attendance.currentAttendance?.clockIn, attendance.currentAttendance?.status, attendance.todayActivities, uiState.currentStatus]);

  const refreshData = async () => {
    await Promise.all([
      attendance.refreshData(),
      notifications.refreshNotifications(),
      requests.refreshRequests(),
      auth.refreshUser(), // Added to refresh user data
    ]);
  };

  const contextValue: AppContextType = {
    // Auth
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    updateProfile: auth.updateProfile,
    
    // Attendance
    currentAttendance: attendance.currentAttendance,
    todayActivities: attendance.todayActivities,
    attendanceHistory: attendance.attendanceHistory,
    clockIn: attendance.clockIn,
    clockOut: attendance.clockOut,
    addActivity: attendance.addActivity,
    updateAttendanceStatus: attendance.updateStatus,
    
    // Requests
    requests: requests.requests,
    createRequest: requests.createRequest,
    
    // Notifications
    notifications: notifications.notifications,
    unreadNotifications: notifications.unreadCount,
    markNotificationAsRead: notifications.markAsRead,
    markAllNotificationsAsRead: notifications.markAllAsRead,
    deleteNotification: notifications.deleteNotification,
    
    // UI State
    isWorking: !!attendance.currentAttendance && attendance.currentAttendance.status !== 'completed',
    currentStatus: uiState.currentStatus,
    setCurrentStatus,
    workHours: uiState.workHours,
    breakTime: uiState.breakTime,
    overtimeHours: uiState.overtimeHours,
    clientVisitTime: uiState.clientVisitTime,
    isLoading: auth.isLoading || attendance.isLoading || notifications.isLoading || requests.isLoading,
    error: auth.error || attendance.error || notifications.error || requests.error,
    
    // Actions
    refreshData,
  };
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};