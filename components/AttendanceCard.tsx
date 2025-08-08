import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradientWrapper } from '@/components/LinearGradientWrapper';
import { LogIn, LogOut, MapPin, Clock, Coffee, Play, Pause } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocalizedDate } from '@/hooks/useI18n';
import { useAppContext } from '@/context/AppContext';

const { width } = Dimensions.get('window');

interface AttendanceCardProps {
  isWorking: boolean;
  workHours: string;
  onClockIn: () => void;
  onClockOut: () => void;
  clockInTime: Date | null;
  isLoading?: boolean;
  currentStatus: 'working' | 'break' | 'off';
}

export function AttendanceCard({
  isWorking,
  workHours,
  onClockIn,
  onClockOut,
  clockInTime,
  isLoading = false,
  currentStatus,
}: AttendanceCardProps) {
  const { todayActivities } = useAppContext();
  const { t } = useTranslation();
  const { formatTime } = useLocalizedDate();
  const hasTakenBreak = todayActivities.some(
    (act) => act.type === 'break_start' || act.type === 'break_end'
  );
  const renderActionButtons = () => {
    if (!isWorking) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onClockIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <LogIn size={20} color="#4A90E2" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? t('clock_in.processing') : t('attendance.clock_in')}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (currentStatus === 'break') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#E91E63' }]}
          onPress={() => router.push('/end-break/selfie')}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Play size={20} color="white" />
            <Text style={[styles.buttonText, { color: 'white' }]}>{t('attendance.end_break')}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.halfButton, { backgroundColor: '#FF9800' }]}
            onPress={() => router.push('/start-break/selfie')}
            disabled={isLoading || hasTakenBreak}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Coffee size={20} color="white" />
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {hasTakenBreak ? t('break.break_used') : t('attendance.start_break')}
              </Text>
            </View>
          </TouchableOpacity>
        <TouchableOpacity
          style={[styles.halfButton, { backgroundColor: '#F44336' }]}
          onPress={() => router.push('/clock-out/selfie')}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <LogOut size={20} color="white" />
            <Text style={[styles.buttonText, { color: 'white' }]}>{t('attendance.clock_out')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradientWrapper
        colors={isWorking ? (currentStatus === 'break' ? ['#FF9800', '#F57C00'] : ['#4CAF50', '#45A049']) : ['#4A90E2', '#357ABD']}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isWorking ? (currentStatus === 'break' ? '#FFC107' : '#81C784') : '#90CAF9' }]} />
            <Text style={styles.statusText}>
              {isWorking ? (currentStatus === 'break' ? t('attendance.on_break') : t('attendance.currently_working')) : t('attendance.ready_to_start')}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.workHours}>{workHours}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.mainText}>
            {isWorking ? (currentStatus === 'break' ? t('attendance.enjoy_break') : t('attendance.currently_working')) : t('attendance.ready_to_start')}
          </Text>
          <Text style={styles.subText}>
            {isWorking 
              ? `${t('attendance.started_at')} ${clockInTime ? formatTime(clockInTime) : ''}`
              : t('attendance.tap_to_begin')
            }
          </Text>

          <View style={styles.locationContainer}>
            <MapPin size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.locationText}>{t('clock_in.office')} • PT. INDOBUZZ REPUBLIK DIGITAL</Text>
          </View>
        </View>

        {renderActionButtons()}
      </LinearGradientWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -30,
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
  workHours: {
    fontSize: 16,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
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
    color: '#4A90E2',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});