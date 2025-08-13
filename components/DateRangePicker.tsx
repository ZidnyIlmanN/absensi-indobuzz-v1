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
import { Calendar as CalendarIcon, X, Check, ToggleLeft, ToggleRight } from 'lucide-react-native';
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
  allowSingleDay?: boolean; // New prop to enable single-day mode
  defaultMode?: 'single' | 'range'; // Default selection mode
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  minDate,
  maxDate,
  placeholder = 'Select date range',
  disabled = false,
  allowSingleDay = true,
  defaultMode = 'range',
}: DateRangePickerProps) {
  const { t, formatLeaveDateShort, getDateFormat } = useI18n();
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string | null>(endDate);
  const [selectionMode, setSelectionMode] = useState<'single' | 'range'>(defaultMode);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

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
      // Check if it's a single day (start and end are the same)
      if (startDate === endDate) {
        return formatDisplayDate(startDate);
      }
      
      const days = calculateDaysDifference(startDate, endDate);
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)} (${days} ${days === 1 ? t('leave_request.day') : t('leave_request.days')})`;
    }

    return placeholder;
  };

  const handleDateSelect = (day: DateData) => {
    const selectedDate = day.dateString;

    if (selectionMode === 'single') {
      // Single-day mode: set both start and end to the same date
      setTempStartDate(selectedDate);
      setTempEndDate(selectedDate);
      setIsSelectingEnd(false);
    } else {
      // Range mode: handle start/end date selection
      if (!tempStartDate || isSelectingEnd) {
        if (!tempStartDate) {
          // First selection - set start date
          setTempStartDate(selectedDate);
          setTempEndDate(null);
          setIsSelectingEnd(true);
        } else {
          // Second selection - set end date
          if (selectedDate >= tempStartDate) {
            setTempEndDate(selectedDate);
            setIsSelectingEnd(false);
          } else {
            // If selected date is before start date, make it the new start date
            setTempStartDate(selectedDate);
            setTempEndDate(null);
            setIsSelectingEnd(true);
          }
        }
      } else {
        // Reset and start new selection
        setTempStartDate(selectedDate);
        setTempEndDate(null);
        setIsSelectingEnd(true);
      }
    }
  };

  const handleModeToggle = () => {
    const newMode = selectionMode === 'single' ? 'range' : 'single';
    setSelectionMode(newMode);
    
    // If switching to single mode and we have a range, keep only start date
    if (newMode === 'single' && tempStartDate && tempEndDate && tempStartDate !== tempEndDate) {
      setTempEndDate(tempStartDate);
    }
    
    setIsSelectingEnd(false);
  };

  const handleConfirm = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setShowCalendar(false);
    setIsSelectingEnd(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsSelectingEnd(false);
    setShowCalendar(false);
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setIsSelectingEnd(false);
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (tempStartDate) {
      if (selectionMode === 'single' || tempStartDate === tempEndDate) {
        // Single day selection - highlight as a complete selection
        marked[tempStartDate] = {
          selected: true,
          selectedColor: '#4A90E2',
          selectedTextColor: 'white',
        };
      } else {
        // Range selection
        marked[tempStartDate] = {
          startingDay: true,
          color: '#4A90E2',
          textColor: 'white',
        };
      }
    }

    if (tempEndDate && tempStartDate !== tempEndDate && selectionMode === 'range') {
      marked[tempEndDate] = {
        endingDay: true,
        color: '#4A90E2',
        textColor: 'white',
      };

      // Mark dates in between for range selection
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
    }

    return marked;
  };

  const getInstructionText = () => {
    if (selectionMode === 'single') {
      return t('leave_request.select_single_day');
    } else {
      if (!tempStartDate) {
        return t('leave_request.select_start_date');
      } else if (isSelectingEnd) {
        return t('leave_request.select_end_date');
      } else {
        return t('leave_request.tap_to_change_selection');
      }
    }
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

            {/* Mode Toggle */}
            {allowSingleDay && (
              <View style={styles.modeToggleContainer}>
                <Text style={styles.modeToggleLabel}>{t('leave_request.selection_mode')}</Text>
                <View style={styles.modeToggle}>
                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      selectionMode === 'single' && styles.activeModeOption
                    ]}
                    onPress={() => selectionMode !== 'single' && handleModeToggle()}
                  >
                    <Text style={[
                      styles.modeOptionText,
                      selectionMode === 'single' && styles.activeModeOptionText
                    ]}>
                      {t('leave_request.single_day')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      selectionMode === 'range' && styles.activeModeOption
                    ]}
                    onPress={() => selectionMode !== 'range' && handleModeToggle()}
                  >
                    <Text style={[
                      styles.modeOptionText,
                      selectionMode === 'range' && styles.activeModeOptionText
                    ]}>
                      {t('leave_request.date_range')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {t('leave_request.date_format_hint', { format: getDateFormat() })} • {getInstructionText()}
              </Text>
              
              {tempStartDate && tempEndDate && (
                <View style={styles.durationContainer}>
                  <Text style={styles.durationText}>
                    {selectionMode === 'single' 
                      ? t('leave_request.single_day_selected')
                      : `${t('leave_request.duration')}: ${calculateDaysDifference(tempStartDate, tempEndDate)} ${calculateDaysDifference(tempStartDate, tempEndDate) === 1 ? t('leave_request.day') : t('leave_request.days')}`
                    }
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
              markingType={selectionMode === 'single' ? 'simple' : 'period' as any}
              markedDates={getMarkedDates()}
              enableSwipeMonths={true}
              hideExtraDays={true}
              firstDay={1} // Monday as first day
            />

            {/* Selection Summary */}
            {(tempStartDate || tempEndDate) && (
              <View style={styles.selectionSummary}>
                <Text style={styles.selectionSummaryTitle}>
                  {t('leave_request.selected_period')}
                </Text>
                <Text style={styles.selectionSummaryText}>
                  {tempStartDate && tempEndDate && tempStartDate === tempEndDate
                    ? `${t('leave_request.single_day')}: ${formatDisplayDate(tempStartDate)}`
                    : tempStartDate && tempEndDate
                      ? `${formatDisplayDate(tempStartDate)} - ${formatDisplayDate(tempEndDate)}`
                      : tempStartDate
                        ? `${t('leave_request.start')}: ${formatDisplayDate(tempStartDate)}`
                        : ''
                  }
                </Text>

              </View>
            )}

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
                  (!tempStartDate || (selectionMode === 'range' && isSelectingEnd && !tempEndDate)) && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={!tempStartDate || (selectionMode === 'range' && isSelectingEnd && !tempEndDate)}
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
  modeToggleContainer: {
    marginBottom: 16,
  },
  modeToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeModeOption: {
    backgroundColor: '#4A90E2',
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeModeOptionText: {
    color: 'white',
    fontWeight: '600',
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
  selectionSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,

  },
  selectionSummaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectionSummaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  selectionDuration: {
    fontSize: 14,
    color: '#666',
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