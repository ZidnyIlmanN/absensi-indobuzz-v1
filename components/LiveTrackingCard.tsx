import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradientWrapper } from '@/components/LinearGradientWrapper';
import { MapPin, Users, Activity, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { useLiveTracking } from '@/hooks/useLiveTracking';

const { width } = Dimensions.get('window');

export function LiveTrackingCard() {
  const { t } = useTranslation();
  const { currentAttendance } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    employees,
    isLoading,
    error,
  } = useLiveTracking({
    enableRealTimeTracking: true,
    trackingInterval: 10000,
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if user is working to show/hide the component
  const isWorking = currentAttendance && currentAttendance.status !== 'completed';

  // Don't render if user is not working
  if (!isWorking) {
    return null;
  }

  const onlineEmployees = employees.filter(emp => emp.status === 'online');
  const breakEmployees = employees.filter(emp => emp.status === 'break');

  const handlePress = () => {
    router.push('/live-tracking');
  };

  return (
    <View style={styles.container}>
      <LinearGradientWrapper
        colors={['#2196F3', '#1976D2']}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{t('live_tracking.live_tracking_active')}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Activity size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.mainText}>{t('live_tracking.real_time_monitoring')}</Text>
          <Text style={styles.subText}>
            {t('live_tracking.track_employee_locations')}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.statValue}>{onlineEmployees.length}</Text>
              <Text style={styles.statLabel}>{t('live_tracking.online')}</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.statValue}>{breakEmployees.length}</Text>
              <Text style={styles.statLabel}>{t('live_tracking.on_break')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <MapPin size={20} color="#2196F3" />
            <Text style={styles.buttonText}>{t('live_tracking.view_live_map')}</Text>
            <ChevronRight size={16} color="#2196F3" />
          </View>
        </TouchableOpacity>
      </LinearGradientWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#81C784',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  content: {
    marginBottom: 20,
  },
  mainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  actionButton: {
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
    marginRight: 8,
  },
});