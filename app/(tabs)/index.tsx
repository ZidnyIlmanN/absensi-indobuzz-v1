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
  Image,
} from 'react-native';
import { LinearGradientWrapper } from '@/components/LinearGradientWrapper';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Clock, MapPin, Calendar, TrendingUp, LogIn, LogOut, Camera, Wifi, WifiOff, Grid2x2 as Grid, Sun, Sunset, Moon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useI18n, useLocalizedDate } from '@/hooks/useI18n';
import { AttendanceCard } from '@/components/AttendanceCard';
import { AttendanceStatusCard } from '@/components/AttendanceStatusCard';
import { StatsCard } from '@/components/StatsCard';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppContext } from '@/context/AppContext';
import { LanguageSelector } from '@/components/LanguageSelector';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { formatDate, formatTime } = useLocalizedDate();
  const { user, currentAttendance, isWorking, workHours, clockIn, clockOut, currentStatus, attendanceHistory } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      updateGreeting(now);
      if (currentAttendance?.clockIn) {
        const diff = new Date().getTime() - currentAttendance.clockIn.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const workHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }, 1000);

    return () => clearInterval(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAttendance?.clockIn]);

  const updateGreeting = (time: Date) => {
    const hour = time.getHours();
    let newGreeting = '';
    let newIcon = null;

    if (hour >= 5 && hour < 12) {
      newGreeting = t('home.good_morning');
      newIcon = <Sun size={20} color="rgba(255, 255, 255, 0.9)" />;
    } else if (hour >= 12 && hour < 17) {
      newGreeting = t('home.good_afternoon');
      newIcon = <Sun size={20} color="rgba(255, 255, 255, 0.9)" />;
    } else if (hour >= 17 && hour < 21) {
      newGreeting = t('home.good_evening');
      newIcon = <Sunset size={20} color="rgba(255, 255, 255, 0.9)" />;
    } else {
      newGreeting = t('home.good_night');
      newIcon = <Moon size={20} color="rgba(255, 255, 255, 0.9)" />;
    }

    if (newGreeting !== greeting) {
      setGreeting(newGreeting);
      setGreetingIcon(newIcon);
    } else if (!greeting) {
      setGreeting(newGreeting);
      setGreetingIcon(newIcon);
    }
  };

  // Initialize greeting on component mount
  useEffect(() => {
    updateGreeting(new Date());
  }, []);

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
      title: t('home.view_all_features'),
      icon: <Grid size={24} color="#4A90E2" />,
    },
    {
      title: t('home.live_attendance'),
      icon: <TrendingUp size={24} color="#4A90E2" />,

    },
    {
      title: t('home.request_permission'),
      icon: <Calendar size={24} color="#FF6B6B" />,

    },
    {
      title: t('home.reimburse'),
      icon: <Clock size={24} color="#4CAF50" />,

    },
  ];

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <View style={styles.container}>

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Enhanced Header */}
          <LinearGradientWrapper
            colors={['#667eea', '#4A90E2', 'rgba(255, 255, 255, 0.1)']}
            locations={[0, 0.6, 1]}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
          >
            {/* Background Pattern */}
            <View style={styles.headerPattern}>
              <View style={[styles.patternCircle, styles.circle1]} />
              <View style={[styles.patternCircle, styles.circle2]} />
              <View style={[styles.patternCircle, styles.circle3]} />
            </View>

            {/* Header Content */}
            <View style={styles.headerContent}>
              <View style={styles.userSection}>
                <TouchableOpacity
                  style={styles.profilePhotoContainer}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: user?.avatar || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100'
                    }}
                    style={styles.profilePhoto} 
                  />
                  <View style={styles.profilePhotoBorder} />
                  <View style={styles.profilePhotoGlow} />
                </TouchableOpacity>

                <View style={styles.userInfo}>
                  <View style={styles.greetingContainer}>
                    <View style={styles.greetingRow}>
                      {greetingIcon}
                      <Text style={styles.greeting}>{greeting},</Text>
                    </View>
                  </View>
                  <Text style={styles.userName}>{user?.name || 'Employee Name'}</Text>
                  <Text style={styles.userRole}>{user?.position || 'Software Developer'}</Text>
                </View>
              </View>
            </View>

            {/* Time and Date Display */}
            <View style={styles.timeSection}>
              <View style={styles.timeContainer}>
                <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
                <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
              </View>
              <WeatherDisplay 
                style={styles.weatherContainer}
                showDetailedInfo={true}
                autoRefreshInterval={15}
              />
            </View>
          </LinearGradientWrapper>

          {/* Language Selection positioned to the right of LinearGradientWrapper */}
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector compact={true} />
          </View>

          <View style={styles.content}>
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
                onPressBreak={() => router.push('/attendance')} />
            );
          })()}

          <AttendanceCard
            isWorking={isWorking}
            workHours={workHours}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            clockInTime={currentAttendance?.clockIn || null}
            isLoading={isLoading}
            currentStatus={currentAttendance?.status === 'completed'
              ? 'off'
              : currentAttendance?.status === 'break'
                ? 'break'
                : currentAttendance?.status || 'off'} />

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.quick_actions')}</Text>
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
                        router.push('/ajukan-izin');
                        break;
                      case 3:
                        router.push('/reimburse');
                        break;
                      default:
                        Alert.alert(t('common.error'), `${action.title} feature coming soon!`);
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
            <Text style={styles.sectionTitle}>{t('home.todays_overview')}</Text>
            <View style={styles.statsGrid}>
              <StatsCard
                title={t('home.work_hours')}
                value={workHours}
                icon={<Clock size={20} color="#4A90E2" />}
                color="#E3F2FD" />
              <StatsCard
                title={t('home.status')}
                value={isWorking ? t('home.working') : t('home.off')}
                icon={<TrendingUp size={20} color="#4CAF50" />}
                color="#E8F5E8" />
            </View>
          </View>

          {/* Recent Attendance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.recent_attendance')}</Text>
              <TouchableOpacity onPress={() => router.push('/attendance-history')}>
                <Text style={styles.viewAllText}>{t('common.view_all')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.attendanceList}
              onPress={() => router.push('/attendance-history')}
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
                        {record.status === 'working' || record.clockIn ? t('home.clock_in') : t('home.clock_out')}
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
                        {record.status === 'completed' ? t('home.completed') : record.status === 'working' ? t('home.working') : t('home.pending')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View key="no-records" style={styles.attendanceItem}>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceType}>{t('home.no_attendance_records')}</Text>
                    <Text style={styles.attendanceTime}>{t('home.start_clocking')}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: 50,
    left: -20,
  },
  headerContent: {
    zIndex: 1,
    marginBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePhotoBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  profilePhotoGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 35,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    flex: 1,
  },
  greetingContainer: {
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderWidth: .5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    elevation: 2,
    padding: 16,
    zIndex: 1,
  },
  timeContainer: {
    flex: 1,
  },
  currentTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 2,
  },
  currentDate: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.48)',
    fontWeight: '400',
  },
  weatherContainer: {
    maxWidth: 200,
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 50,
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