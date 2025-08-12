import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { useI18n } from '@/hooks/useI18n';

interface LeavePeriodDisplayProps {
  startDate: string | null;
  endDate: string | null;
  leaveType: 'full_day' | 'half_day';
  showDuration?: boolean;
  style?: any;
}

export function LeavePeriodDisplay({
  startDate,
  endDate,
  leaveType,
  showDuration = true,
  style,
}: LeavePeriodDisplayProps) {
  const { t, formatLeaveDate, formatLeaveDateShort } = useI18n();

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(0, diffDays);
  };

  const formatPeriodDisplay = () => {
    if (!startDate) return t('leave_request.no_date_selected');
    
    // Single day leave (start and end dates are the same)
    if (startDate === endDate) {
      return {
        type: 'single',
        display: formatLeaveDate(startDate),
        duration: 1,
      };
    }
    
    // Multi-day leave
    if (endDate) {
      const duration = calculateDuration();
      return {
        type: 'range',
        display: `${formatLeaveDateShort(startDate)} - ${formatLeaveDateShort(endDate)}`,
        duration,
      };
    }
    
    // Only start date selected
    return {
      type: 'partial',
      display: formatLeaveDate(startDate),
      duration: 1,
    };
  };

  const periodInfo = formatPeriodDisplay();

  if (!startDate) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <Calendar size={16} color="#E0E0E0" />
        <Text style={styles.emptyText}>{t('leave_request.no_date_selected')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Calendar size={20} color="#4A90E2" />
        </View>
        <Text style={styles.title}>{t('leave_request.leave_period')}</Text>
      </View>

      <View style={styles.content}>
        {/* Period Display */}
        <View style={styles.periodContainer}>
          {periodInfo.type === 'single' ? (
            // Single day display
            <View style={styles.singleDayContainer}>
              <View style={styles.singleDayBadge}>
                <Text style={styles.singleDayBadgeText}>{t('leave_request.single_day')}</Text>
              </View>
              <Text style={styles.singleDayText}>{periodInfo.display}</Text>
            </View>
          ) : periodInfo.type === 'range' ? (
            // Date range display
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateRangeBadge}>
                <Text style={styles.dateRangeBadgeText}>{t('leave_request.date_range')}</Text>
              </View>
              <View style={styles.dateRangeContent}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>{t('leave_request.start')}</Text>
                  <Text style={styles.dateValue}>{formatLeaveDateShort(startDate)}</Text>
                </View>
                
                <View style={styles.dateArrow}>
                  <ChevronRight size={16} color="#E0E0E0" />
                </View>
                
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>{t('leave_request.end')}</Text>
                  <Text style={styles.dateValue}>{formatLeaveDateShort(endDate!)}</Text>
                </View>
              </View>
            </View>
          ) : (
            // Partial selection (only start date)
            <View style={styles.partialContainer}>
              <View style={styles.partialBadge}>
                <Text style={styles.partialBadgeText}>{t('leave_request.incomplete')}</Text>
              </View>
              <Text style={styles.partialText}>{periodInfo.display}</Text>
              <Text style={styles.partialHint}>{t('leave_request.select_end_date')}</Text>
            </View>
          )}
        </View>

        {/* Duration and Type Info */}
        {showDuration && periodInfo.duration > 0 && (
          <View style={styles.durationInfo}>
            <View style={styles.durationItem}>
              <Clock size={16} color="#FF9800" />
              <Text style={styles.durationLabel}>{t('leave_request.total_duration')}</Text>
              <Text style={styles.durationValue}>
                {periodInfo.duration} {periodInfo.duration === 1 ? t('leave_request.day') : t('leave_request.days')}
              </Text>
            </View>
            
            <View style={styles.typeInfo}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: leaveType === 'full_day' ? '#4A90E2' : '#FF9800' }
              ]}>
                <Text style={styles.typeBadgeText}>
                  {leaveType === 'full_day' ? t('leave_request.full_day') : t('leave_request.half_day')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    gap: 12,
  },
  periodContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  singleDayContainer: {
    alignItems: 'center',
  },
  singleDayBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  singleDayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  singleDayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  dateRangeContainer: {
    alignItems: 'center',
  },
  dateRangeBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateRangeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  dateRangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  dateArrow: {
    marginHorizontal: 16,
  },
  partialContainer: {
    alignItems: 'center',
  },
  partialBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  partialBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  partialText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  partialHint: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  durationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  typeInfo: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});