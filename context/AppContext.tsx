import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, AttendanceRecord, Request, Notification, Employee, ActivityRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import { useNotifications } from '@/hooks/useNotifications';
import { useRequests } from '@/hooks/useRequests';
import { useState } from 'react';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentAttendance: AttendanceRecord | null;
  isWorking: boolean;
  currentStatus: 'ready' | 'working' | 'break' | 'overtime' | 'client_visit';
  workHours: string;
  breakTime: string;
  overtimeHours: string;
  clientVisitTime: string;
  todayActivities: ActivityRecord[];
  requests: Request[];
  notifications: Notification[];
  unreadNotifications: number;
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WORKING_STATUS'; payload: boolean }
  | { type: 'SET_CURRENT_STATUS'; payload: 'ready' | 'working' | 'break' | 'overtime' | 'client_visit' }
  | { type: 'SET_ATTENDANCE'; payload: AttendanceRecord | null }
  | { type: 'SET_WORK_HOURS'; payload: string }
  | { type: 'SET_BREAK_TIME'; payload: string }
  | { type: 'SET_OVERTIME_HOURS'; payload: string }
  | { type: 'SET_CLIENT_VISIT_TIME'; payload: string }
  | { type: 'ADD_ACTIVITY'; payload: ActivityRecord }
  | { type: 'SET_TODAY_ACTIVITIES'; payload: ActivityRecord[] }
  | { type: 'ADD_REQUEST'; payload: Request }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  currentAttendance: null,
  isWorking: false,
  currentStatus: 'ready',
  workHours: '00:00',
  breakTime: '00:00',
  overtimeHours: '00:00',
  clientVisitTime: '00:00',
  todayActivities: [],
  requests: [],
  notifications: [],
  unreadNotifications: 0,
  employees: [],
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case 'SET_WORKING_STATUS':
      return { ...state, isWorking: action.payload };
    case 'SET_CURRENT_STATUS':
      return { ...state, currentStatus: action.payload };
    case 'SET_ATTENDANCE':
      return { ...state, currentAttendance: action.payload };
    case 'SET_WORK_HOURS':
      return { ...state, workHours: action.payload };
    case 'SET_BREAK_TIME':
      return { ...state, breakTime: action.payload };
    case 'SET_OVERTIME_HOURS':
      return { ...state, overtimeHours: action.payload };
    case 'SET_CLIENT_VISIT_TIME':
      return { ...state, clientVisitTime: action.payload };
    case 'ADD_ACTIVITY':
      return { ...state, todayActivities: [action.payload, ...state.todayActivities] };
    case 'SET_TODAY_ACTIVITIES':
      return { ...state, todayActivities: action.payload };
    case 'ADD_REQUEST':
      return { ...state, requests: [action.payload, ...state.requests] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

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
  workHours: string;
  breakTime: string;
  overtimeHours: string;
  clientVisitTime: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  
  // State management
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Auth hooks
  const auth = useAuth();
  
  // Data hooks
  const attendance = useAttendance(auth.user?.id || null);
  const notifications = useNotifications(auth.user?.id || null);
  const requests = useRequests(auth.user?.id || null);
  
  // Sync auth state with local state
  React.useEffect(() => {
    dispatch({ type: 'SET_USER', payload: auth.user });
    dispatch({ type: 'SET_LOADING', payload: auth.isLoading });
    dispatch({ type: 'SET_ERROR', payload: auth.error });
  }, [auth.user, auth.isLoading, auth.error]);

  // Sync attendance state
  React.useEffect(() => {
    dispatch({ type: 'SET_ATTENDANCE', payload: attendance.currentAttendance });
    dispatch({ type: 'SET_TODAY_ACTIVITIES', payload: attendance.todayActivities });
    dispatch({ type: 'SET_WORKING_STATUS', payload: !!attendance.currentAttendance });
  }, [attendance.currentAttendance, attendance.todayActivities]);

  // Calculate real-time work hours
  React.useEffect(() => {
    if (!attendance.currentAttendance?.clockIn) return;

    const timer = setInterval(() => {
      const now = new Date();
      const clockInTime = attendance.currentAttendance!.clockIn.getTime();
      
      let totalWorkTime = 0;
      let totalBreakTime = 0;
      let totalOvertimeTime = 0;
      let totalClientVisitTime = 0;
      
      // Calculate time based on activities
      const activities = [...state.todayActivities].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
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
      switch (state.currentStatus) {
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
      
      dispatch({ type: 'SET_WORK_HOURS', payload: formatTime(totalWorkTime) });
      dispatch({ type: 'SET_BREAK_TIME', payload: formatTime(totalBreakTime) });
      dispatch({ type: 'SET_OVERTIME_HOURS', payload: formatTime(totalOvertimeTime) });
      dispatch({ type: 'SET_CLIENT_VISIT_TIME', payload: formatTime(totalClientVisitTime) });
    }, 1000);

    return () => clearInterval(timer);
  }, [attendance.currentAttendance?.clockIn, state.todayActivities, state.currentStatus]);

  const refreshData = async () => {
    await Promise.all([
      attendance.refreshData(),
      notifications.refreshNotifications(),
      requests.refreshRequests(),
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
    isWorking: state.isWorking,
    currentStatus: state.currentStatus,
    workHours: state.workHours,
    breakTime: state.breakTime,
    overtimeHours: state.overtimeHours,
    clientVisitTime: state.clientVisitTime,
    isLoading: auth.isLoading || attendance.isLoading || notifications.isLoading || requests.isLoading,
    error: auth.error || attendance.error || notifications.error || requests.error,
    
    // Actions
    refreshData,
    
    // State management
    state,
    dispatch,
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