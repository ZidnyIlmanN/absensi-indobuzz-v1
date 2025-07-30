import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  LogIn,
  LogOut,
  Coffee,
  RefreshCw,
  RotateCcw,
  User,
  Users,
  List,
  ChevronRight,
  Activity,
  Timer,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { DynamicAttendanceCard } from '@/components/DynamicAttendanceCard';
import { ActivityRecord } from '@/types';

const { width } = Dimensions.get('window');

export default function LiveAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Real-time calculation of work hours, break time, overtime, and client visit time
      if (state.currentAttendance?.clockIn) {
        calculateRealTimeTotals();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.currentAttendance?.clockIn, calculateRealTimeTotals]); // Add calculateRealTimeTotals

  // Calculate real-time totals based on activities and current status
  const calculateRealTimeTotals = useCallback(() => {
    if (!state.currentAttendance?.clockIn) return;

    const now = new Date();
    const clockInTime = state.currentAttendance.clockIn.getTime();
    
    let totalWorkTime = 0;
    let totalBreakTime = 0;
    let totalOvertimeTime = 0;
    let totalClientVisitTime = 0;
    
    // Calculate time based on activities
    const activities = [...state.todayActivities].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let currentActivityStart = clockInTime;
    let currentActivityType: 'working' | 'break' | 'overtime' | 'client_visit' = 'working';
    
    // Process all completed activities
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
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
    
    // Convert to readable format and dispatch updates
    const formatTime = (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    dispatch({ type: 'SET_WORK_HOURS', payload: formatTime(totalWorkTime) });
    dispatch({ type: 'SET_BREAK_TIME', payload: formatTime(totalBreakTime) });
    dispatch({ type: 'SET_OVERTIME_HOURS', payload: formatTime(totalOvertimeTime) });
    dispatch({ type: 'SET_CLIENT_VISIT_TIME', payload: formatTime(totalClientVisitTime) });
  }, [state.currentAttendance?.clockIn, state.todayActivities, state.currentStatus, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Updated quick stats with new metrics
  const quickStats = [
    {
      icon: <Clock size={20} color="#4A90E2" />,
      label: 'Work Time',
      value: state.workHours,
      color: '#E3F2FD',
    },
    {
      icon: <Coffee size={20} color="#FF9800" />,
      label: 'Break Time',
      value: state.breakTime,
      color: '#FFF3E0',
    },
    {
      icon: <RotateCcw size={20} color="#9C27B0" />,
      label: 'Overtime',
      value: state.overtimeHours,
      color: '#F3E5F5',
    },
    {
      icon: <Users size={20} color="#2196F3" />,
      label: 'Client Visit',
      value: state.clientVisitTime,
      color: '#E3F2FD',
    },
  ];

  const quickActions = [
    {
      id: 'schedule',
      title: 'Jadwal Shift',
      icon: <Calendar size={24} color="#4A90E2" />,
      iconColor: '#4A90E2',
      backgroundColor: '#E3F2FD',
      route: '/shift-schedule',
    },
    {
      id: 'history',
      title: 'Histori Absensi',
      icon: <List size={24} color="#666" />,
      iconColor: '#666',
      backgroundColor: '#F8F9FA',
      route: '/attendance-history',
    },
  ];

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  // Helper function to get activity display info
  const getActivityDisplayInfo = (activity: ActivityRecord) => {
    const activityConfig = {
      clock_in: {
        title: 'Clock In',
        color: '#4CAF50',
        icon: <LogIn size={12} color="#4CAF50" />,
      },
      clock_out: {
        title: 'Clock Out',
        color: '#F44336',
        icon: <LogOut size={12} color="#F44336" />,
      },
      break_start: {
        title: 'Break Started',
        color: '#FF9800',
        icon: <Coffee size={12} color="#FF9800" />,
      },
      break_end: {
        title: 'Break Ended',
        color: '#4CAF50',
        icon: <Activity size={12} color="#4CAF50" />,
      },
      overtime_start: {
        title: 'Overtime Started',
        color: '#9C27B0',
        icon: <RotateCcw size={12} color="#9C27B0" />,
      },
      overtime_end: {
        title: 'Overtime Ended',
        color: '#4CAF50',
        icon: <Activity size={12} color="#4CAF50" />,
      },
      client_visit_start: {
        title: 'Client Visit Started',
        color: '#2196F3',
        icon: <Users size={12} color="#2196F3" />,
      },
      client_visit_end: {
        title: 'Client Visit Ended',
        color: '#4CAF50',
        icon: <Activity size={12} color="#4CAF50" />,
      },
    };
    
    return activityConfig[activity.type] || {
      title: 'Activity',
      color: '#666',
      icon: <Activity size={12} color="#666" />,
    };
  };
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Live Attendance</Text>
            <Text style={styles.headerSubtitle}>
              {currentTime.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>

          <View style={styles.timeDisplay}>
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationContainer}>
          <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.locationText}>PT. INDOBUZZ REPUBLIK DIGITAL</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dynamic Attendance Card */}
        <DynamicAttendanceCard />

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
                <View style={styles.statIcon}>
                  {stat.icon}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.timelineContainer}>
            {/* Always show clock in if working */}
            {state.currentAttendance?.clockIn && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Clock In</Text>
                  <Text style={styles.timelineTime}>
                    {state.currentAttendance.clockIn.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  <Text style={styles.timelineLocation}>PT. INDOBUZZ REPUBLIK DIGITAL</Text>
                </View>
              </View>
            )}

            {/* Show all activities in reverse chronological order */}
            {state.todayActivities.map((activity) => {
              const displayInfo = getActivityDisplayInfo(activity);
              return (
                <View key={activity.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: displayInfo.color }]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      {displayInfo.icon}
                      <Text style={styles.timelineTitle}>{displayInfo.title}</Text>
                    </View>
                    <Text style={styles.timelineTime}>
                      {activity.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    <Text style={styles.timelineLocation}>
                      {activity.location?.address || 'PT. INDOBUZZ REPUBLIK DIGITAL'}
                    </Text>
                    {activity.notes && (
                      <Text style={styles.timelineNotes}>{activity.notes}</Text>
                    )}
                  </View>
                </View>
              );
            })}
            {/* Show current status if working */}
            {state.isWorking && state.currentStatus !== 'working' && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#FF9800' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Currently {state.currentStatus === 'break' ? 'On Break' : 
                               state.currentStatus === 'overtime' ? 'In Overtime' :
                               state.currentStatus === 'client_visit' ? 'On Client Visit' : 'Working'}
                  </Text>
                  <Text style={styles.timelineTime}>Active now</Text>
                  <Text style={styles.timelineLocation}>Live session</Text>
                </View>
              </View>
            )}

            {/* Show empty state if no activities */}
            {!state.currentAttendance && state.todayActivities.length === 0 && (
              <View style={styles.emptyState}>
                <Activity size={32} color="#E0E0E0" />
                <Text style={styles.emptyStateText}>No activities today</Text>
                <Text style={styles.emptyStateSubtext}>Clock in to start tracking your day</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.backgroundColor }]}
                onPress={() => handleQuickAction(action.route)}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  {action.icon}
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <ChevronRight size={16} color={action.iconColor} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot}>
            <Activity size={16} color="#4CAF50" />
          </View>
          <Text style={styles.statusText}>
            System Online • Last sync: {currentTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeDisplay: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  timelineContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  timelineTime: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 12,
    color: '#666',
  },
  timelineNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    marginRight: 16,
  },
  quickActionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  statusDot: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
});