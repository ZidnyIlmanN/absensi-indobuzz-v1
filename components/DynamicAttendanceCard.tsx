import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  LogIn,
  LogOut,
  Coffee,
  RefreshCw,
  RotateCcw,
  User,
  Users,
  Clock,
  MapPin,
  Camera,
  Activity,
} from 'lucide-react-native';
import { ColorValue } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { ActivityRecord } from '@/types';
import { useI18n } from '@/hooks/useI18n';

const { width } = Dimensions.get('window');

export function DynamicAttendanceCard() {
  const { 
    isWorking, 
    currentStatus, 
    setCurrentStatus, 
    currentAttendance, 
    todayActivities, 
    workHours, 
    addActivity 
  } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const handleClockIn = () => {
    router.push('/clock-in');
  };

  const handleClockOut = () => {
    Alert.alert(
      t('attendance.clock_out'),
      t('attendance.take_selfie_clock_out'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('clock_in.take_selfie'),
          onPress: () => {
            router.push('/clock-out/selfie');
          },
        },
      ]
    );
  };

  const handleStateChange = (newState: 'overtime' | 'client_visit') => {
    setIsLoading(true);

    const currentState = currentStatus;

    if (currentState === 'overtime') {
      addActivity('overtime_end');
    } else if (currentState === 'client_visit') {
      addActivity('client_visit_end');
    }

    if (newState === 'overtime') {
      addActivity('overtime_start');
    } else if (newState === 'client_visit') {
      addActivity('client_visit_start');
    }

    setTimeout(() => {
      setCurrentStatus(newState);
      setIsLoading(false);

      const stateMessages = {
        working: t('home.working'),
        overtime: t('overtime.overtime_mode'),
        client_visit: t('client_visit.client_visit'),
      };

      Alert.alert(t('common.success'), stateMessages[newState] || t('common.success'));
    }, 1000);
  };
  
  const getCardConfig = () => {
    if (!isWorking) {
      return {
        state: 'ready',
        title: t('attendance.ready_to_start'),
        subtitle: t('attendance.tap_to_begin'),
        colors: ['#4A90E2', '#357ABD'] as readonly ColorValue[],
        icon: <LogIn size={24} color="white" />,
        buttonText: t('attendance.clock_in'),
        buttonAction: handleClockIn,
      };
    }

    switch (currentStatus) {
      case 'working': {
        const hasTakenBreak = todayActivities.some(
          (act) => act.type === 'break_start' || act.type === 'break_end'
        );
        return {
          state: 'working',
          title: t('attendance.currently_working'),
          subtitle: `${t('attendance.started_at')} ${currentAttendance?.clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          colors: ['#4CAF50', '#45A049'] as readonly ColorValue[],
          icon: <Activity size={24} color="white" />,
          buttonText: hasTakenBreak ? '' : t('attendance.start_break'),
          buttonAction: hasTakenBreak ? undefined : () => router.push('/start-break/selfie'),
        };
      }
      case 'break':
        return {
          state: 'break',
          title: t('attendance.on_break'),
          subtitle: t('attendance.enjoy_break'),
          colors: ['#FF9800', '#F57C00'] as readonly ColorValue[],
          icon: <Coffee size={24} color="white" />,
          buttonText: t('attendance.end_break'),
          buttonAction: () => router.push('/end-break/selfie'),
        };
      case 'overtime':
        return {
          state: 'overtime',
          title: t('overtime.overtime_mode'),
          subtitle: t('overtime.working_extended_hours'),
          colors: ['#9C27B0', '#7B1FA2'] as readonly ColorValue[],
          icon: <RotateCcw size={24} color="white" />,
          buttonText: t('overtime.end_overtime'),
          buttonAction: () => setCurrentStatus('working'),
        };
      case 'client_visit':
        return {
          state: 'client_visit',
          title: t('client_visit.client_visit'),
          subtitle: t('client_visit.currently_visiting'),
          colors: ['#2196F3', '#1976D2'] as readonly ColorValue[],
          icon: <Users size={24} color="white" />,
          buttonText: t('client_visit.end_client_visit'),
          buttonAction: () => setCurrentStatus('working'),
        };
      default:
        return {
          state: 'working',
          title: t('attendance.currently_working'),
          subtitle: `${t('attendance.started_at')} ${currentAttendance?.clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          colors: ['#4CAF50', '#45A049'] as readonly ColorValue[],
          icon: <Activity size={24} color="white" />,
          buttonText: t('attendance.start_break'),
          buttonAction: () => router.push('/start-break/selfie'),
        };
    }
  };

  const config = getCardConfig();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.colors as readonly [ColorValue, ColorValue, ...ColorValue[]]}
        style={styles.card}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]} />
            <Text style={styles.statusText}>{config.title}</Text>
          </View>
          <View style={styles.workHoursContainer}>
            <Clock size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.workHours}>{workHours}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            {config.icon}
          </View>
          <Text style={styles.mainTitle}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {config.buttonText ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={config.buttonAction}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>

                <Text style={styles.buttonText}>
                  {isLoading ? t('common.loading') : config.buttonText}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Secondary Actions */}
          {isWorking && (
            <View style={styles.secondaryActions}>
              {currentStatus === 'working' && (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleStateChange('overtime')}
                  >
                    <RotateCcw size={16} color="#4A90E2" />
                    <Text style={styles.secondaryButtonText}>{t('overtime.start_overtime')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleStateChange('client_visit')}
                  >
                    <Users size={16} color="#4A90E2" />
                    <Text style={styles.secondaryButtonText}>{t('client_visit.start_client_visit')}</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, styles.clockOutButton]}
                onPress={handleClockOut}
              >
                <LogOut size={16} color="#F44336" />
                <Text style={[styles.secondaryButtonText, { color: '#F44336' }]}>{t('attendance.clock_out')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -40,
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  workHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workHours: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clockOutButton: {
    backgroundColor: 'rgba(255, 78, 66, 0.2)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 6,
    fontWeight: '500',
  },
});