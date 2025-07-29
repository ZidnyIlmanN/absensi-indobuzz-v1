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

const { width } = Dimensions.get('window');

export default function LiveAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const quickStats = [
    {
      icon: <Clock size={20} color="#4A90E2" />,
      label: 'Today',
      value: state.workHours,
      color: '#E3F2FD',
    },
    {
      icon: <Calendar size={20} color="#4CAF50" />,
      label: 'This Week',
      value: '42h 30m',
      color: '#E8F5E8',
    },
    {
      icon: <TrendingUp size={20} color="#FF9800" />,
      label: 'This Month',
      value: '168h 45m',
      color: '#FFF3E0',
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
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Clock In</Text>
                <Text style={styles.timelineTime}>08:30 AM</Text>
                <Text style={styles.timelineLocation}>PT. INDOBUZZ REPUBLIK DIGITAL</Text>
              </View>
            </View>

            {state.isWorking && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#4A90E2' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Currently Working</Text>
                  <Text style={styles.timelineTime}>{state.workHours} elapsed</Text>
                  <Text style={styles.timelineLocation}>Active session</Text>
                </View>
              </View>
            )}
          </div>
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
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
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
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
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