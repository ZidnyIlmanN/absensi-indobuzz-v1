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
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  LogIn,
  LogOut,
  Camera,
  Wifi,
  WifiOff,
  Grid,
} from 'lucide-react-native';
import { AttendanceCard } from '@/components/AttendanceCard';
import { AttendanceStatusCard } from '@/components/AttendanceStatusCard';
import { QuickActionCard } from '@/components/QuickActionCard';
import { StatsCard } from '@/components/StatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppContext } from '@/context/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentAttendance, isWorking, workHours, clockIn, clockOut, currentStatus, attendanceHistory } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (currentAttendance?.clockIn) {
        const diff = new Date().getTime() - currentAttendance.clockIn.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const workHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }, 1000);

    return () => clearInterval(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAttendance?.clockIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Get the most recent attendance records (last 2)
  const getRecentAttendance = () => {
    // Combine current attendance with historical records
    const allRecords = currentAttendance 
      ? [...attendanceHistory, currentAttendance] 
      : attendanceHistory;
    
    // Sort by date (newest first) and take the last 2 records
    return allRecords
      .sort((a, b) => {
        const dateA = a.clockIn ? new Date(a.clockIn).getTime() : 0;
        const dateB = b.clockIn ? new Date(b.clockIn).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 2);
  };

  const recentAttendance = getRecentAttendance();

  // Update recent attendance when attendance data changes
  useEffect(() => {
    // This will trigger a re-render with updated recent attendance
  }, [attendanceHistory, currentAttendance]);

  const handleClockIn = () => {
    router.push('/clock-in');
  };

  const handleClockOut = () => {
    if (!isOnline) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }

    Alert.alert(
      'Clock Out',
      'Please take a selfie to confirm clock out',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Selfie',
          onPress: () => {
            setIsLoading(true);
            // Simulate API call
            setTimeout(() => {
              setIsLoading(false); // This should be handled by the clockOut function in context
              // The following dispatches are no longer needed here as context manages state
              // dispatch({ type: 'SET_WORKING_STATUS', payload: false });
              // dispatch({ type: 'SET_ATTENDANCE', payload: null });
              // dispatch({ type: 'SET_WORK_HOURS', payload: '00:00' });
              Alert.alert('Success', 'You have successfully clocked out!');
            }, 1500);
          },
        },
      ]
    );
  };

  const quickActions = [
    {
      title: 'Lihat\nSemua',
      icon: <Grid size={24} color="#4A90E2" />,
    },
    {
      title: 'Live\nAttendance',
      icon: <TrendingUp size={24} color="#4A90E2" />,

    },
    {
      title: 'Time Off',
      icon: <Calendar size={24} color="#FF6B6B" />,

    },
    {
      title: 'Reimburse',
      icon: <Clock size={24} color="#4CAF50" />,

    },
  ];

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good Morning,</Text>
              <Text style={styles.userName}>{user?.name || 'Employee Name'}</Text>
            </View>
            <View style={styles.headerRight}>

              <View style={styles.timeContainer}>
                <Text style={styles.currentTime}>
                  {currentTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <Text style={styles.currentDate}>
                  {currentTime.toLocaleDateString([], {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
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

          {/* Attendance Card */}
          {/* Derive breakStartTime from currentAttendance.activities */}
          {(() => {
            let breakStartTime: Date | null = null;
            if (currentAttendance?.activities && currentAttendance.activities.length > 0) {
              const breakStartActivity = currentAttendance.activities
                .filter(act => act.type === 'break_start')
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
              if (breakStartActivity) {
                breakStartTime = breakStartActivity.timestamp;
              }
            }
            return (
              <AttendanceStatusCard
                clockInTime={currentAttendance?.clockIn || null}
                breakStartTime={breakStartTime}
                attendanceStatus={currentAttendance?.status || 'ready'}
                onPressClockIn={() => router.push('/attendance')}
                onPressBreak={() => router.push('/attendance')}
              />
            );
          })()}
          <AttendanceCard
            isWorking={isWorking}
            workHours={workHours}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut} 
            clockInTime={currentAttendance?.clockIn || null}
            isLoading={isLoading}
          currentStatus={
            currentAttendance?.status === 'completed'
              ? 'off'
              : currentAttendance?.status === 'break'
              ? 'break'
              : currentAttendance?.status || 'off'
          }
          />

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
          <TouchableOpacity
            key={`action-${index}`}
            style={[styles.quickActionWrapper, { backgroundColor: 'transparent' }]}
            onPress={() => {
              switch (index) {
                case 0:
                  router.push('/lihat-semua');
                  break;
                case 1:
                  router.push('/live-attendance-protected');
                  break;
                case 2:
                  router.push('/timeoff');
                  break;
                case 3:
                  router.push('/reimburse');
                  break;
                default:
                  Alert.alert('Feature', `${action.title} feature coming soon!`);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              {action.icon}
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
          </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Today's Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              <StatsCard 
                title="Work Hours"
                value={workHours}
                icon={<Clock size={20} color="#4A90E2" />}
                color="#E3F2FD"
              />
              <StatsCard
                title="Status"
                value={isWorking ? "Working" : "Off"}
                icon={<TrendingUp size={20} color="#4CAF50" />}
                color="#E8F5E8"
              />
            </View>
          </View>

          {/* Recent Attendance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Attendance</Text>
              <TouchableOpacity onPress={() => router.push('/attendance-history')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.attendanceList}
              onPress={() => router.push('/attendance')}
              activeOpacity={0.7}
            >
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record, index) => (
                  <View key={record.id ? `${record.id}-${index}` : `record-${index}`} style={styles.attendanceItem}>
                    <View style={styles.attendanceIconContainer}>
                      {record.status === 'working' || record.clockIn ? (
                        <LogIn size={20} color="#4CAF50" />
                      ) : (
                        <LogOut size={20} color="#FF6B6B" />
                      )}
                    </View>
                    <View style={styles.attendanceInfo}>
                      <Text style={styles.attendanceType}>
                        {record.status === 'working' || record.clockIn ? 'Clock In' : 'Clock Out'}
                      </Text>
                      <Text style={styles.attendanceTime}>
                        {record.clockIn 
                          ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : record.clockOut 
                          ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'N/A'}
                      </Text>
                      <Text style={styles.attendanceDate}>
                        {record.clockIn 
                          ? new Date(record.clockIn).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) 
                          : record.clockOut 
                          ? new Date(record.clockOut).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) 
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.attendanceStatus}>
                      <Text style={[
                        styles.statusText, 
                        { color: record.status === 'completed' ? '#4CAF50' : record.status === 'working' ? '#4A90E2' : '#FF9800' }
                      ]}>
                        {record.status === 'completed' ? 'Completed' : record.status === 'working' ? 'Working' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View key="no-records" style={styles.attendanceItem}>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceType}>No attendance records</Text>
                    <Text style={styles.attendanceTime}>Start clocking in to see your attendance history</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {isLoading && (
          <LoadingSpinner 
            overlay
            text={isWorking ? "Clocking out..." : "Clocking in..."}
          />
        )}
      </View>
    </ErrorBoundary>
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
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  connectionStatus: {
    marginBottom: 8,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  currentDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingTop: 50, // Menambahkan ruang antara header dan AttendanceCard
    paddingBottom: 50, // Menambahkan ruang di bagian bawah
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,

  },
  quickActionWrapper: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: 8,
    padding: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5b5b5bff',
    textAlign: 'center',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  attendanceList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    shadowRadius: 3,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  attendanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  attendanceTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attendanceDate: {
    fontSize: 12,
    color: '#999',
  },
  attendanceStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});