import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Calendar,
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Play,
  ChevronRight,
  Camera,
} from 'lucide-react-native';
import { AttendanceRecord } from '@/types';

interface AttendanceHistoryCardProps {
  record: AttendanceRecord;
  workHours: string;
  onPress: () => void;
  index: number;
}

export function AttendanceHistoryCard({
  record,
  workHours,
  onPress,
  index,
}: AttendanceHistoryCardProps) {
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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

  const getBreakTimes = () => {
    const breakStart = record.activities.find(act => act.type === 'break_start');
    const breakEnd = record.activities.find(act => act.type === 'break_end');
    return {
      breakStarted: breakStart ? breakStart.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      breakEnded: breakEnd ? breakEnd.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
    };
  };

  const { breakStarted, breakEnded } = getBreakTimes();

  // Count available photos
  const photoCount = [
    record.selfieUrl,
    ...record.activities.map(act => act.selfieUrl).filter(Boolean)
  ].filter(Boolean).length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Calendar size={16} color="#666" />
            <Text style={styles.dateText}>{formatDate(record.clockIn)}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {photoCount > 0 && (
              <View style={styles.photoIndicator}>
                <Camera size={12} color="#4A90E2" />
                <Text style={styles.photoCount}>{photoCount}</Text>
              </View>
            )}
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(record.status) }
            ]}>
              <Text style={styles.statusText}>
                {record.status === 'working' ? 'Working' : 'Completed'}
              </Text>
            </View>
            
            <ChevronRight size={16} color="#C7C7CC" />
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <LogIn size={14} color="#4CAF50" />
            <Text style={styles.detailLabel}>In</Text>
            <Text style={styles.detailValue}>
              {record.clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Coffee size={14} color="#FF9800" />
            <Text style={styles.detailLabel}>Break</Text>
            <Text style={styles.detailValue}>{breakStarted}</Text>
          </View>

          <View style={styles.detailItem}>
            <Play size={14} color="#E91E63" />
            <Text style={styles.detailLabel}>Resume</Text>
            <Text style={styles.detailValue}>{breakEnded}</Text>
          </View>

          <View style={styles.detailItem}>
            <LogOut size={14} color="#F44336" />
            <Text style={styles.detailLabel}>Out</Text>
            <Text style={styles.detailValue}>
              {record.clockOut 
                ? record.clockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : record.status === 'working' ? 'Working...' : 'N/A'
              }
            </Text>
          </View>
        </View>

        {/* Work Hours Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Clock size={16} color="#4A90E2" />
            <Text style={styles.summaryLabel}>Total Work Hours</Text>
            <Text style={styles.summaryValue}>{workHours}</Text>
          </View>
        </View>

        {/* Tap to view indicator */}
        <View style={styles.tapIndicator}>
          <Text style={styles.tapIndicatorText}>Tap to view details</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A90E2',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  summary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  tapIndicator: {
    alignItems: 'center',
  },
  tapIndicatorText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});