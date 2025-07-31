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

const { width } = Dimensions.get('window');

export default function AttendanceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (state.currentAttendance?.clockIn) {
        const diff = new Date().getTime() - state.currentAttendance.clockIn.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const workHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        dispatch({ type: 'SET_WORK_HOURS', payload: workHours });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.currentAttendance?.clockIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call or data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Helper to get break start and end times from today's activities
  const getBreakTimes = () => {
    const breakStartActivity = state.todayActivities.find(act => act.type === 'break_start');
    const breakEndActivity = state.todayActivities.find(act => act.type === 'break_end');
    return {
      breakStarted: breakStartActivity ? breakStartActivity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      breakEnded: breakEndActivity ? breakEndActivity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
    };
  };

  // Build attendance history array from state
  const attendanceHistory = [];

  if (state.currentAttendance) {
    const { breakStarted, breakEnded } = getBreakTimes();

    attendanceHistory.push({
      id: 'current',
      date: 'Today',
      clockIn: state.currentAttendance.clockIn ? state.currentAttendance.clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      breakStarted,
      breakEnded,
      clockOut: state.isWorking ? 'Working...' : (state.currentAttendance.clockOut ? state.currentAttendance.clockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'),
      workHours: state.isWorking ? state.workHours : '00:00',
      status: state.isWorking ? 'working' : 'completed',
    });
  }

  // TODO: Add past attendance records if available in state or API

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return '#4CAF50';
      case 'completed':
        return '#4A90E2';
      default:
        return '#9E9E9E';
    }
  };

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
            <Text style={styles.statValue}>8.5h</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={24} color="#4CAF50" />
            <Text style={styles.statValue}>22</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          
          <View style={styles.statCard}>
            <Users size={24} color="#FF9800" />
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance History</Text>
          
          {attendanceHistory.map((record) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyDate}>
                  <Calendar size={16} color="#666" />
                  <Text style={styles.historyDateText}>{record.date}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(record.status) }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {record.status === 'working' ? 'Working' : 'Completed'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.historyDetails}>
                <View style={styles.historyItem}>
                  <LogIn size={16} color="#4CAF50" />
                  <Text style={styles.historyLabel}>Clock In</Text>
                  <Text style={styles.historyValue}>{record.clockIn}</Text>
                </View>

                <View style={styles.historyItem}>
                  <Coffee size={16} color="#FFA500" />
                  <Text style={styles.historyLabel}>Break Started</Text>
                  <Text style={styles.historyValue}>{record.breakStarted}</Text>
                </View>

                <View style={styles.historyItem}>
                  <Coffee size={16} color="#FF8C00" />
                  <Text style={styles.historyLabel}>Break Ended</Text>
                  <Text style={styles.historyValue}>{record.breakEnded}</Text>
                </View>
                
                <View style={styles.historyItem}>
                  <LogOut size={16} color="#F44336" />
                  <Text style={styles.historyLabel}>Clock Out</Text>
                  <Text style={styles.historyValue}>{record.clockOut}</Text>
                </View>
                
                <View style={styles.historyItem}>
                  <Clock size={16} color="#4A90E2" />
                  <Text style={styles.historyLabel}>Work Hours</Text>
                  <Text style={styles.historyValue}>{record.workHours}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});
