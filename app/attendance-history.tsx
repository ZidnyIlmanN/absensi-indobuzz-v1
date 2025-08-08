import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Clock, Calendar, TrendingUp, Users, LogIn, LogOut, Coffee } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AttendanceDetailModal } from '@/components/AttendanceDetailModal';
import { AttendanceHistoryCard } from '@/components/AttendanceHistoryCard';
import { AttendanceRecord } from '@/types';

const { width } = Dimensions.get('window');

export default function AttendanceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { currentAttendance, todayActivities, isWorking, workHours, attendanceHistory: contextAttendanceHistory, refreshData } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update stats when attendance data changes
  useEffect(() => {
    // This will trigger a re-render with updated stats
  }, [currentAttendance, contextAttendanceHistory, workHours]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAttendancePress = (attendance: AttendanceRecord, displayWorkHours: string) => {
    setSelectedAttendance(attendance);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAttendance(null);
  };
  // Calculate stats from attendance history
  const calculateStats = () => {
    // Include current attendance in the history for calculations
    const allRecords = currentAttendance 
      ? [...contextAttendanceHistory, currentAttendance] 
      : contextAttendanceHistory;

    // Filter records for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthRecords = allRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    // Calculate average daily work hours
    const totalWorkHours = allRecords.reduce((sum, record) => {
      // For current attendance, use the real-time workHours from context
      if (record.id === currentAttendance?.id) {
        // Convert HH:MM format to decimal hours
        const [hours, minutes] = workHours.split(':').map(Number);
        return sum + (hours + minutes / 60);
      }
      // For historical records, use stored work_hours value
      return sum + (record.workHours || 0);
    }, 0);
    
    const avgDailyHours = allRecords.length > 0 ? totalWorkHours / allRecords.length : 0;

    // Days worked this month
    const daysThisMonth = thisMonthRecords.length;

    // Attendance rate (assuming 22 working days in a month as a standard)
    const attendanceRate = Math.round((daysThisMonth / 22) * 100);

    return {
      avgDailyHours: avgDailyHours,
      daysThisMonth: daysThisMonth,
      attendanceRate: attendanceRate > 100 ? 100 : attendanceRate // Cap at 100%
    };
  };

  const { avgDailyHours, daysThisMonth, attendanceRate } = calculateStats();

  // Helper to get break start and end times from activities
  // Helper to format decimal hours to HH:MM format
  const formatHoursToHHMM = (hours: number) => {
    if (!hours) return '00:00';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Helper to calculate work hours from clock in/out timestamps
  const calculateWorkHours = (clockIn: Date | undefined, clockOut: Date | undefined) => {
    if (!clockIn || !clockOut) return 0;
    const diffMs = clockOut.getTime() - clockIn.getTime();
    return diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
  };

  const getBreakTimes = (activities: any[]) => {
    const breakStartActivity = activities.find(act => act.type === 'break_start');
    const breakEndActivity = activities.find(act => act.type === 'break_end');
    return {
      breakStarted: breakStartActivity ? breakStartActivity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      breakEnded: breakEndActivity ? breakEndActivity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
    };
  };

  // Build attendance history array from context
  const allAttendanceRecords = [...contextAttendanceHistory].reverse(); // Display newest first

  if (currentAttendance) {
    // Check if currentAttendance is already in the history to avoid duplicates
    const isCurrentInHistory = allAttendanceRecords.some(record => record.id === currentAttendance.id);
    if (!isCurrentInHistory) {
      allAttendanceRecords.unshift(currentAttendance); // Add current attendance to the beginning
    }
  }

  // Map the attendance records to the format expected by the UI

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histori Absensi</Text>
          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollViewContent}
      >

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#4A90E2" />
            <Text style={styles.statValue}>{avgDailyHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{daysThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          
          <View style={styles.statCard}>
            <Users size={24} color="#FF9800" />
            <Text style={styles.statValue}>{attendanceRate}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance History</Text>

          {allAttendanceRecords.map((record, index) => {
            const recordWorkHours = record.id === currentAttendance?.id 
              ? workHours 
              : formatHoursToHHMM(calculateWorkHours(record.clockIn, record.clockOut));

            return (
              <AttendanceHistoryCard
                key={record.id}
                record={record}
                workHours={recordWorkHours}
                onPress={() => handleAttendancePress(record, recordWorkHours)}
                index={index}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        visible={showDetailModal}
        onClose={closeDetailModal}
        attendance={selectedAttendance}
        workHours={selectedAttendance?.id === currentAttendance?.id ? workHours : 
          selectedAttendance ? formatHoursToHHMM(calculateWorkHours(selectedAttendance.clockIn, selectedAttendance.clockOut)) : '00:00'}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
    scrollViewContent: {
    paddingTop: 24, // Menambahkan ruang antara header dan AttendanceCard
    paddingBottom: 24, // Menambahkan ruang di bagian bawah
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
});
