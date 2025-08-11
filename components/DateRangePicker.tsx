import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Calendar as CalendarIcon, X, Check } from 'lucide-react-native';
import { useI18n } from '@/hooks/useI18n';

const { width } = Dimensions.get('window');

interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  minDate,
  maxDate,
  placeholder = 'Select date range',
  disabled = false,
}: DateRangePickerProps) {
  const { t, formatLeaveDateShort, getDateFormat } = useI18n();
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string | null>(endDate);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    return formatLeaveDateShort(dateString);
  };

  const calculateDaysDifference = (start: string | null, end: string | null): number => {
    if (!start || !end) return 0;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return Math.max(0, diffDays);
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) {
      return placeholder;
    }

    if (startDate && !endDate) {
      return formatDisplayDate(startDate);
    }

    if (startDate && endDate) {
      const days = calculateDaysDifference(startDate, endDate);
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)} (${days} ${days === 1 ? t('leave_request.day') : t('leave_request.days')})`;
    }

    return placeholder;
  };

  const handleDateSelect = (day: DateData) => {
    const selectedDate = day.dateString;

    if (selectionMode === 'start') {
      setTempStartDate(selectedDate);
      
      // If end date is before start date, clear it
      if (tempEndDate && selectedDate > tempEndDate) {
        setTempEndDate(null);
      }
      
      // Switch to end date selection
      setSelectionMode('end');
    } else {
      // End date selection
      if (tempStartDate && selectedDate >= tempStartDate) {
        setTempEndDate(selectedDate);
      } else {
        // If selected date is before start date, make it the new start date
        setTempStartDate(selectedDate);
        setTempEndDate(null);
        setSelectionMode('end');
      }
    }
  };

  const handleConfirm = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setShowCalendar(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setSelectionMode('start');
    setShowCalendar(false);
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectionMode('start');
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (tempStartDate) {
      marked[tempStartDate] = {
        startingDay: true,
        color: '#4A90E2',
        textColor: 'white',
      };
    }

    if (tempEndDate && tempStartDate !== tempEndDate) {
      marked[tempEndDate] = {
        endingDay: true,
        color: '#4A90E2',
        textColor: 'white',
      };
    }

    // Mark dates in between
    if (tempStartDate && tempEndDate && tempStartDate !== tempEndDate) {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        if (dateString !== tempStartDate && dateString !== tempEndDate) {
          marked[dateString] = {
            color: '#E3F2FD',
            textColor: '#4A90E2',
          };
        }
      }
    }

    return marked;
  };

  const today = new Date().toISOString().split('T')[0];
  const defaultMinDate = minDate || today;

  return (
    <>
      <TouchableOpacity
        style={[styles.dateInput, disabled && styles.disabledInput]}
        onPress={() => !disabled && setShowCalendar(true)}
        disabled={disabled}
      >
        <CalendarIcon size={20} color={disabled ? "#BDBDBD" : "#666"} />
        <Text style={[
          styles.dateText,
          (!startDate && !endDate) && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showCalendar}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {t('leave_request.select_date_range')}
              </Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {t('leave_request.date_format_hint', { format: getDateFormat() })} • {' '}
                {selectionMode === 'start' 
                  ? t('leave_request.select_start_date')
                  : t('leave_request.select_end_date')
                }
              </Text>
              
              {tempStartDate && tempEndDate && (
                <View style={styles.durationContainer}>
                  <Text style={styles.durationText}>
                    {t('leave_request.duration')}: {calculateDaysDifference(tempStartDate, tempEndDate)} {calculateDaysDifference(tempStartDate, tempEndDate) === 1 ? t('leave_request.day') : t('leave_request.days')}
                  </Text>
                </View>
              )}
            </View>

            {/* Calendar */}
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#4A90E2',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4A90E2',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#4A90E2',
                selectedDotColor: '#ffffff',
                arrowColor: '#4A90E2',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#2d4150',
                indicatorColor: '#4A90E2',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              minDate={defaultMinDate}
              maxDate={maxDate}
              onDayPress={handleDateSelect}
              markingType="period"
              markedDates={getMarkedDates()}
              enableSwipeMonths={true}
              hideExtraDays={true}
              firstDay={1} // Monday as first day
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>{t('common.clear')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!tempStartDate || !tempEndDate) && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={!tempStartDate || !tempEndDate}
              >
                <Check size={16} color="white" />
                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  disabledText: {
    color: '#BDBDBD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  instructionsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 4,
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  calendar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});