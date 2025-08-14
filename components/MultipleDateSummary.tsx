import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, X, Clock, MapPin } from 'lucide-react-native';
import { useI18n } from '@/hooks/useI18n';

interface MultipleDateSummaryProps {
  selectedDates: string[];
  leaveType: 'full_day' | 'half_day';
  onRemoveDate?: (date: string) => void;
  showRemoveButtons?: boolean;
  style?: any;
}

interface DateGroup {
  monthYear: string;
  dates: Array<{
    date: string;
    day: number;
    dayName: string;
  }>;
}

export function MultipleDateSummary({
  selectedDates,
  leaveType,
  onRemoveDate,
  showRemoveButtons = false,
  style,
}: MultipleDateSummaryProps) {
  const { t, formatLeaveDateShort } = useI18n();

  if (selectedDates.length === 0) {
    return null;
  }

  // Group dates by month and year
  const groupedDates: DateGroup[] = React.useMemo(() => {
    const groups: { [key: string]: DateGroup } = {};
    
    selectedDates.forEach(dateString => {
      const date = new Date(dateString);
      const monthYear = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = {
          monthYear,
          dates: [],
        };
      }
      
      groups[monthYear].dates.push({
        date: dateString,
        day: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    });
    
    // Sort groups by date and sort dates within each group
    return Object.values(groups)
      .sort((a, b) => new Date(a.dates[0].date).getTime() - new Date(b.dates[0].date).getTime())
      .map(group => ({
        ...group,
        dates: group.dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }));
  }, [selectedDates]);

  const calculateTotalDays = () => {
    // Ensure we're calculating based on actual selected dates, not date range
    const actualDays = selectedDates.length;
    
    if (leaveType === 'half_day') {
      return actualDays * 0.5;
    }
    return actualDays;
  };

  const formatDuration = (days: number) => {
    if (days === 1) {
      return `1 ${t('leave_request.day')}`;
    } else if (days % 1 === 0) {
      return `${days} ${t('leave_request.days')}`;
    } else {
      return `${days} ${t('leave_request.days')}`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={20} color="#4A90E2" />
          <Text style={styles.title}>
            {selectedDates.length === 1 
              ? t('leave_request.selected_date')
              : t('leave_request.selected_dates')
            }
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedDates.length}</Text>
          </View>
        </View>
      </View>


      {/* Grouped Dates Display */}
      <ScrollView 
        style={styles.datesScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {groupedDates.map((group, groupIndex) => (
          <View key={group.monthYear} style={styles.monthGroup}>
            <Text style={styles.monthHeader}>{group.monthYear}</Text>
            
            <View style={styles.datesGrid}>
              {group.dates.map((dateInfo, dateIndex) => (
                <View key={dateInfo.date} style={styles.dateCard}>
                  <View style={styles.dateCardContent}>
                    <Text style={styles.dayNumber}>{dateInfo.day}</Text>
                    <Text style={styles.dayName}>{dateInfo.dayName}</Text>
                  </View>
                  
                  {showRemoveButtons && onRemoveDate && (
                    <TouchableOpacity
                      style={styles.removeDateButton}
                      onPress={() => onRemoveDate(dateInfo.date)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={12} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>


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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  durationSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  typeIndicator: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  datesScrollView: {
    maxHeight: 200,
    marginBottom: 2,
  },
  monthGroup: {
    marginBottom: 16,
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 8,
    minWidth: 50,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  dateCardContent: {
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 2,
  },
  dayName: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '500',
  },
  removeDateButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
});