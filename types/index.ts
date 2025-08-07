export interface User {
  totalWorkHours: string;
  totalDays: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  avatar?: string;
  employeeId: string;
  joinDate: string;
  location: string;
  workSchedule: string;
}

export interface AttendanceRecord {
  breakStartTime: null;
  id: string;
  userId: string;
  clockIn: Date;
  clockOut?: Date;
  date: string;
  workHours: number;
  breakTime: number; // Total break time in minutes
  overtimeHours: number; // Total overtime in minutes
  clientVisitTime: number; // Total client visit time in minutes
  status: 'working' | 'completed' | 'break';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  selfieUrl?: string;
  notes?: string;
  activities: ActivityRecord[]; // Track all activities during the day
}

export interface ActivityRecord {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'overtime_start' | 'overtime_end' | 'client_visit_start' | 'client_visit_end';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  selfieUrl?: string;
}

export interface Request {
  id: string;
  userId: string;
  type: 'leave' | 'permission' | 'reimbursement';
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'announcement' | 'reminder' | 'approval' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  position: string;
  department: string;
  avatar?: string;
  status: 'online' | 'offline' | 'break';
  workHours: string;
  location: string;
  phone: string;
  email: string;
  joinDate?: string;
  isActive: boolean;
  currentAttendance?: AttendanceRecord;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  workLocations: WorkLocation[];
  workSchedules: WorkSchedule[];
}

export interface WorkLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters for geofencing
}

export interface WorkSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  workDays: number[]; // 0-6, Sunday to Saturday
  type: 'office' | 'remote' | 'hybrid';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AttendanceState {
  currentRecord: AttendanceRecord | null;
  todayRecord: AttendanceRecord | null;
  isWorking: boolean;
  workHours: string;
  attendanceHistory: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    clockInReminder: boolean;
    clockOutReminder: boolean;
    announcements: boolean;
    requestUpdates: boolean;
  };
  location: {
    enableGPS: boolean;
    enableGeofencing: boolean;
  };
}