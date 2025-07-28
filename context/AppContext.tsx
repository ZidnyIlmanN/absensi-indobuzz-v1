import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, AttendanceRecord, Request, Notification, Employee } from '@/types';

interface AppState {
  user: User | null;
  currentAttendance: AttendanceRecord | null;
  isWorking: boolean;
  workHours: string;
  requests: Request[];
  notifications: Notification[];
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ATTENDANCE'; payload: AttendanceRecord | null }
  | { type: 'SET_WORKING_STATUS'; payload: boolean }
  | { type: 'SET_WORK_HOURS'; payload: string }
  | { type: 'ADD_REQUEST'; payload: Request }
  | { type: 'UPDATE_REQUEST'; payload: Request }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  user: {
    id: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+62 812-3456-7890',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
    employeeId: 'EMP001',
    joinDate: '2022-01-15',
    location: 'Jakarta Office',
    workSchedule: '09:00 - 18:00',
  },
  currentAttendance: null,
  isWorking: false,
  workHours: '00:00',
  requests: [],
  notifications: [],
  employees: [],
  isLoading: false,
  error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_ATTENDANCE':
      return { ...state, currentAttendance: action.payload };
    case 'SET_WORKING_STATUS':
      return { ...state, isWorking: action.payload };
    case 'SET_WORK_HOURS':
      return { ...state, workHours: action.payload };
    case 'ADD_REQUEST':
      return { ...state, requests: [...state.requests, action.payload] };
    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map(req =>
          req.id === action.payload.id ? action.payload : req
        ),
      };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
      };
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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