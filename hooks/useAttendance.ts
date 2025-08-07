import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '@/services/attendance';
import { AttendanceRecord, ActivityRecord } from '@/types';

interface AttendanceState {
  currentAttendance: AttendanceRecord | null;
  todayActivities: ActivityRecord[];
  attendanceHistory: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
}

export function useAttendance(userId: string | null) {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({
    currentAttendance: null,
    todayActivities: [],
    attendanceHistory: [],
    isLoading: true,
    error: null,
  });

  const loadCurrentAttendance = useCallback(async () => {
    if (!userId) return;

    setAttendanceState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { attendance, error } = await attendanceService.getCurrentAttendance(userId);
      
      if (error) {
        setAttendanceState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setAttendanceState(prev => ({
        ...prev,
        currentAttendance: attendance,
        isLoading: false,
      }));
    } catch (error) {
      setAttendanceState(prev => ({
        ...prev,
        error: 'Failed to load attendance data',
        isLoading: false,
      }));
    }
  }, [userId]);

  const loadTodayActivities = useCallback(async () => {
    if (!userId) return;

    try {
      const { activities, error } = await attendanceService.getTodayActivities(userId);
      
      if (!error) {
        setAttendanceState(prev => ({
          ...prev,
          todayActivities: activities,
        }));
      }
    } catch (error) {
      console.error('Failed to load today activities:', error);
    }
  }, [userId]);

  const loadAttendanceHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const { records, error } = await attendanceService.getAttendanceHistory(userId);
      
      if (!error) {
        setAttendanceState(prev => ({
          ...prev,
          attendanceHistory: records,
        }));
      }
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  }, [userId]);

  const clockIn = async (location: { latitude: number; longitude: number; address: string }, selfieUrl?: string) => {
    if (!userId) return { error: 'No user logged in' };

    setAttendanceState(prev => ({ ...prev, isLoading: true, error: null }));

    const { attendance, error } = await attendanceService.clockIn({
      userId,
      location,
      selfieUrl,
    });

    if (error) {
      setAttendanceState(prev => ({ ...prev, error, isLoading: false }));
      return { error };
    }

    setAttendanceState(prev => ({
      ...prev,
      currentAttendance: attendance,
      isLoading: false,
    }));

    // Reload activities
    await loadTodayActivities();

    return { error: null };
  };

  const clockOut = async (selfieUrl?: string, notes?: string) => {
    if (!userId || !attendanceState.currentAttendance) {
      return { error: 'No active attendance record' };
    }

    setAttendanceState(prev => ({ ...prev, isLoading: true, error: null }));

    const { error } = await attendanceService.clockOut({
      attendanceId: attendanceState.currentAttendance.id,
      selfieUrl,
      notes,
    });

    if (error) {
      setAttendanceState(prev => ({ ...prev, error, isLoading: false }));
      return { error };
    }

    setAttendanceState(prev => ({
      ...prev,
      currentAttendance: null,
      isLoading: false,
    }));

    // Reload data
    await Promise.all([
      loadTodayActivities(),
      loadAttendanceHistory(),
    ]);

    return { error: null };
  };

  const addActivity = async (
    type: ActivityRecord['type'],
    location?: { latitude: number; longitude: number; address: string },
    notes?: string,
    selfieUrl?: string
  ) => {
    if (!userId || !attendanceState.currentAttendance) {
      return { error: 'No active attendance record' };
    }

    const { error } = await attendanceService.addActivity({
      attendanceId: attendanceState.currentAttendance.id,
      userId,
      type,
      location,
      notes,
      selfieUrl,
    });

    if (!error) {
      // Reload activities
      await loadTodayActivities();
    }

    return { error };
  };

  const updateStatus = async (status: AttendanceRecord['status']) => {
    if (!attendanceState.currentAttendance) {
      return { error: 'No active attendance record' };
    }

    const { error } = await attendanceService.updateAttendanceStatus(
      attendanceState.currentAttendance.id,
      status
    );

    if (!error) {
      setAttendanceState(prev => ({
        ...prev,
        currentAttendance: prev.currentAttendance ? {
          ...prev.currentAttendance,
          status,
        } : null,
      }));
    }

    return { error };
  };

  const refreshData = async () => {
    await Promise.all([
      loadCurrentAttendance(),
      loadTodayActivities(),
      loadAttendanceHistory(),
    ]);
  };

  useEffect(() => {
    if (userId) {
      Promise.all([
        loadCurrentAttendance(),
        loadTodayActivities(),
        loadAttendanceHistory(),
      ]);
    }
  }, [userId, loadCurrentAttendance, loadTodayActivities, loadAttendanceHistory]);

  return {
    ...attendanceState,
    clockIn,
    clockOut,
    addActivity,
    updateStatus,
    refreshData,
  };
}