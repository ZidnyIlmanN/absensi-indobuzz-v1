import React, { useState, useEffect, useCallback } from 'react';
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
  LogIn,
  LogOut,
  Coffee,
  RotateCcw,
  Users,
  List,
  ChevronRight,
  Activity,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { DynamicAttendanceCard } from '@/components/DynamicAttendanceCard';
import { useTranslation } from 'react-i18next';

export default function LiveAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { workHours, breakTime, overtimeHours, clientVisitTime, refreshData } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const quickActions = [
    {
      id: 'schedule',
      title: t('live_attendance_screen.shift_schedule'),
      icon: <Calendar size={24} color="#4A90E2" />,
      iconColor: '#4A90E2',
      backgroundColor: '#E3F2FD',
      route: '/shift-schedule',
    },
    {
      id: 'history',
      title: t('live_attendance_screen.attendance_history'),
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
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('live_attendance_screen.live_attendance')}</Text>
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
        contentContainerStyle={styles.scrollViewContent}
      >
        <DynamicAttendanceCard />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live_attendance_screen.others')}</Text>
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

        <View style={styles.statusIndicator}>
          <View style={styles.statusDot}>
            <Activity size={16} color="#4CAF50" />
          </View>
          <Text style={styles.statusText}>
            {t('live_attendance_screen.system_online')} • {t('live_attendance_screen.last_sync')}: {currentTime.toLocaleTimeString([], { 
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
  scrollViewContent: {
    paddingTop: 55,
    paddingBottom: 55,
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
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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