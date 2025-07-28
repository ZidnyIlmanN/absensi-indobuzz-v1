import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Clock, MapPin, Calendar, LogIn, LogOut, Camera, TrendingUp, Users, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleClockIn = async () => {
    Alert.alert(
      'Clock In',
      'Take a selfie to confirm your clock in',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Selfie',
          onPress: async () => {
            setIsLoading(true);
            // Simulate camera and API call
            setTimeout(() => {
              setIsLoading(false);
              dispatch({ type: 'SET_WORKING_STATUS', payload: true });
              const now = new Date();
              const attendance = {
                id: Date.now().toString(),
                userId: state.user?.id || '',
                clockIn: now,
                date: now.toISOString().split('T')[0],
                workHours: 0,
                status: 'working' as const,
                location: {
                  latitude: -6.2088,
                  longitude: 106.8456,
                  address: 'Jakarta Office',
                },
                selfieUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
              };
              dispatch({ type: 'SET_ATTENDANCE', payload: attendance });
              Alert.alert('Success', 'You have successfully clocked in!');
            }, 2000);
          },
        },
      ]
    );
  };

  const handleClockOut = async () => {
    Alert.alert(
      'Clock Out',
      'Take a selfie to confirm your clock out',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Selfie',
          onPress: async () => {
            setIsLoading(true);
            // Simulate camera and API call
            setTimeout(() => {
              setIsLoading(false);
              dispatch({ type: 'SET_WORKING_STATUS', payload: false });
              dispatch({ type: 'SET_ATTENDANCE', payload: null });
              dispatch({ type: 'SET_WORK_HOURS', payload: '00:00' });
              Alert.alert('Success', 'You have successfully clocked out!');
            }, 2000);
          },
        },
      ]
    );
  };

  const attendanceHistory = [
    {
      id: '1',
      date: 'Today',
      clockIn: '08:30 AM',
      clockOut: state.isWorking ? 'Working...' : '17:30 PM',
      workHours: state.isWorking ? state.workHours : '09:00',
      status: state.isWorking ? 'working' : 'completed',
    },
    {
      id: '2',
      date: 'Yesterday',
      clockIn: '08:45 AM',
      clockOut: '17:45 PM',
      workHours: '09:00',
      status: 'completed',
    },
    {
      id: '3',
      date: 'Dec 8, 2024',
      clockIn: '09:00 AM',
      clockOut: '18:00 PM',
      workHours: '09:00',
      status: 'completed',
    },
  ];

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
          <Text style={styles.headerTitle}>Live Attendance</Text>
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
      >
        {/* Current Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={state.isWorking ? ['#4CAF50', '#45A049'] : ['#4A90E2', '#357ABD']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {state.isWorking ? 'Currently Working' : 'Ready to Start'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {state.isWorking 
                    ? `Started at ${state.currentAttendance?.clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Tap to clock in and start your workday'
                  }
                </Text>
              </View>
              <View style={styles.workHoursContainer}>
                <Clock size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.workHours}>{state.workHours}</Text>
              </View>
            </View>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationText}>Jakarta Office • Indonesia</Text>
            </View>

            <TouchableOpacity
              style={styles.clockButton}
              onPress={state.isWorking ? handleClockOut : handleClockIn}
              disabled={isLoading}
            >
              <View style={styles.clockButtonContent}>
                {isLoading ? (
                  <LoadingSpinner size="small" color="#4A90E2" />
                ) : state.isWorking ? (
                  <LogOut size={24} color="#4A90E2" />
                ) : (
                  <LogIn size={24} color="#4A90E2" />
                )}
                <Text style={styles.clockButtonText}>
                  {isLoading 
                    ? (state.isWorking ? 'Clocking Out...' : 'Clocking In...') 
                    : (state.isWorking ? 'Clock Out' : 'Clock In')
                  }
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>

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
  statusCard: {
    marginTop: -30,
    marginBottom: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statusGradient: {
    borderRadius: 16,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  workHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workHours: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  clockButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clockButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginLeft: 12,
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