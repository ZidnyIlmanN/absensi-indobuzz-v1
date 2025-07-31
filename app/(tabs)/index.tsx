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
} from 'lucide-react-native';
import { AttendanceCard } from '@/components/AttendanceCard';
import { QuickActionCard } from '@/components/QuickActionCard';
import { StatsCard } from '@/components/StatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppContext } from '@/context/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { 
    user, 
    currentAttendance, 
    isWorking, 
    workHours, 
    clockIn, 
    clockOut,
    isLoading,
    refreshData 
  } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

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
          onPress: () => router.push('/clock-out/selfie'),
        },
      ]
    );
  };

  const quickActions = [
    {
      title: 'Live\nAttendance',
      icon: <TrendingUp size={24} color="#4A90E2" />,
      color: '#E3F2FD',
    },
    {
      title: 'Time Off',
      icon: <Calendar size={24} color="#FF6B6B" />,
      color: '#FFEBEE',
    },
    {
      title: 'Reimburse',
      icon: <Clock size={24} color="#4CAF50" />,
      color: '#E8F5E8',
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
              <Text style={styles.userName}>{user?.name || 'Employee'}</Text>
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
          <AttendanceCard
            isWorking={isWorking}
            workHours={workHours}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            clockInTime={currentAttendance?.clockIn || null}
            isLoading={isProcessing}
          />

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  icon={action.icon}
                  backgroundColor={action.color}
                  onPress={() => {
                    switch (index) {
                      case 0:
                        router.push('/live-attendance');
                        break;
                      case 1:
                        router.push('/timeoff');
                        break;
                      case 2:
                        router.push('/reimburse');
                        break;
                      default:
                        Alert.alert('Feature', `${action.title} feature coming soon!`);
                    }
                  }}
                />
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
              <TouchableOpacity onPress={() => router.push('/attendance')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.attendanceList}
              onPress={() => router.push('/attendance')}
              activeOpacity={0.7}
            >
              <View style={styles.attendanceItem}>
                <View style={styles.attendanceIconContainer}>
                  <LogIn size={20} color="#4CAF50" />
                </View>
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendanceType}>Clock In</Text>
                  <Text style={styles.attendanceTime}>08:30 AM</Text>
                  <Text style={styles.attendanceDate}>Today</Text>
                </View>
                <View style={styles.attendanceStatus}>
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Success</Text>
                </View>
              </View>

              <View style={styles.attendanceItem}>
                <View style={styles.attendanceIconContainer}>
                  <LogOut size={20} color="#FF6B6B" />
                </View>
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendanceType}>Clock Out</Text>
                  <Text style={styles.attendanceTime}>17:30 PM</Text>
                  <Text style={styles.attendanceDate}>Yesterday</Text>
                </View>
                <View style={styles.attendanceStatus}>
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>Pending</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {isProcessing && (
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  attendanceList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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