import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { 
  Calendar as CalendarIcon, 
  X, 
  Check, 
  Plus, 
  Minus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
} from 'lucide-react-native';
import { useI18n } from '@/hooks/useI18n';

const { width } = Dimensions.get('window');

export type DateSelectionMode = 'single' | 'range' | 'multiple';

interface SelectedDateInfo {
  date: string;
  displayName: string;
  monthYear: string;
}

interface MultiDatePickerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  maxSelections?: number;
  mode?: DateSelectionMode;
  onModeChange?: (mode: DateSelectionMode) => void;
}

export function MultiDatePicker({
  selectedDates,
  onDatesChange,
  minDate,
  maxDate,
  placeholder = 'Select dates',
  disabled = false,
  maxSelections = 20,
  mode = 'multiple',
  onModeChange,
}: MultiDatePickerProps) {
  const { t, formatLeaveDateShort, getDateFormat } = useI18n();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tempSelectedDates, setTempSelectedDates] = useState<string[]>(selectedDates);
  const [selectionMode, setSelectionMode] = useState<DateSelectionMode>(mode);

  // Range selection state for when mode is 'range'
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const defaultMinDate = minDate || today;

  // Process selected dates for display
  const selectedDateInfos = useMemo((): SelectedDateInfo[] => {
    return selectedDates
      .sort()
      .map(date => {
        const dateObj = new Date(date);
        return {
          date,
          displayName: formatLeaveDateShort(date),
          monthYear: dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };
      });
  }, [selectedDates, formatLeaveDateShort]);

  // Group dates by month for better organization
  const groupedDates = useMemo(() => {
    const groups: { [key: string]: SelectedDateInfo[] } = {};
    selectedDateInfos.forEach(dateInfo => {
      if (!groups[dateInfo.monthYear]) {
        groups[dateInfo.monthYear] = [];
      }
      groups[dateInfo.monthYear].push(dateInfo);
    });
    return groups;
  }, [selectedDateInfos]);

  const handleDateSelect = useCallback((day: DateData) => {
    const selectedDate = day.dateString;

    if (selectionMode === 'single') {
      setTempSelectedDates([selectedDate]);
    } else if (selectionMode === 'range') {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        // Start new range
        setRangeStart(selectedDate);
        setRangeEnd(null);
        setTempSelectedDates([selectedDate]);
      } else {
        // Complete range
        const start = new Date(rangeStart);
        const end = new Date(selectedDate);
        
        if (end < start) {
          // Swap if end is before start
          setRangeStart(selectedDate);
          setRangeEnd(rangeStart);
        } else {
          setRangeEnd(selectedDate);
        }
        
        // Generate all dates in range
        const rangeDates = generateDateRange(
          end < start ? selectedDate : rangeStart,
          end < start ? rangeStart : selectedDate
        );
        setTempSelectedDates(rangeDates);
      }
    } else {
      // Multiple mode
      const isSelected = tempSelectedDates.includes(selectedDate);
      
      if (isSelected) {
        setTempSelectedDates(prev => prev.filter(date => date !== selectedDate));
      } else {
        if (tempSelectedDates.length >= maxSelections) {
          Alert.alert(
            t('leave_request.max_dates_reached'),
            t('leave_request.max_dates_message', { max: maxSelections })
          );
          return;
        }
        setTempSelectedDates(prev => [...prev, selectedDate].sort());
      }
    }
  }, [selectionMode, rangeStart, rangeEnd, tempSelectedDates, maxSelections, t]);

  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const handleModeChange = (newMode: DateSelectionMode) => {
    setSelectionMode(newMode);
    onModeChange?.(newMode);
    
    // Reset selection state when changing modes
    if (newMode === 'single') {
      setTempSelectedDates(tempSelectedDates.slice(0, 1));
    } else if (newMode === 'range') {
      setRangeStart(null);
      setRangeEnd(null);
      setTempSelectedDates([]);
    }
  };

  const removeDateFromSelection = (dateToRemove: string) => {
    const newDates = tempSelectedDates.filter(date => date !== dateToRemove);
    setTempSelectedDates(newDates);
  };

  const clearAllDates = () => {
    setTempSelectedDates([]);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const handleConfirm = () => {
    onDatesChange(tempSelectedDates);
    setShowCalendar(false);
  };

  const handleCancel = () => {
    setTempSelectedDates(selectedDates);
    setRangeStart(null);
    setRangeEnd(null);
    setShowCalendar(false);
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (selectionMode === 'range' && rangeStart) {
      if (rangeEnd) {
        // Complete range
        const rangeDates = generateDateRange(rangeStart, rangeEnd);
        rangeDates.forEach((date, index) => {
          if (index === 0) {
            marked[date] = {
              startingDay: true,
              color: '#4A90E2',
              textColor: 'white',
            };
          } else if (index === rangeDates.length - 1) {
            marked[date] = {
              endingDay: true,
              color: '#4A90E2',
              textColor: 'white',
            };
          } else {
            marked[date] = {
              color: '#E3F2FD',
              textColor: '#4A90E2',
            };
          }
        });
      } else {
        // Only start date selected
        marked[rangeStart] = {
          selected: true,
          selectedColor: '#4A90E2',
          selectedTextColor: 'white',
        };
      }
    } else {
      // Single or multiple mode
      tempSelectedDates.forEach(date => {
        marked[date] = {
          selected: true,
          selectedColor: '#4A90E2',
          selectedTextColor: 'white',
        };
      });
    }

    return marked;
  };

  const getDisplayText = () => {
    if (selectedDates.length === 0) {
      return placeholder;
    }

    if (selectionMode === 'single' || selectedDates.length === 1) {
      return formatLeaveDateShort(selectedDates[0]);
    }

    if (selectionMode === 'range' && selectedDates.length > 1) {
      const sortedDates = [...selectedDates].sort();
      return `${formatLeaveDateShort(sortedDates[0])} - ${formatLeaveDateShort(sortedDates[sortedDates.length - 1])} (${selectedDates.length} ${selectedDates.length === 1 ? t('leave_request.day') : t('leave_request.days')})`;
    }

    return `${selectedDates.length} ${t('leave_request.dates_selected')}`;
  };

  const getInstructionText = () => {
    switch (selectionMode) {
      case 'single':
        return t('leave_request.select_single_day');
      case 'range':
        if (!rangeStart) {
          return t('leave_request.select_start_date');
        } else if (!rangeEnd) {
          return t('leave_request.select_end_date');
        } else {
          return t('leave_request.range_selected');
        }
      case 'multiple':
        return t('leave_request.tap_dates_to_select');
      default:
        return '';
    }
  };

  const renderSelectedDatesPreview = () => {
    if (tempSelectedDates.length === 0) return null;

    const groupedTempDates = tempSelectedDates.reduce((groups: { [key: string]: string[] }, date) => {
      const dateObj = new Date(date);
      const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(date);
      return groups;
    }, {});

    return (
      <View style={styles.selectedDatesPreview}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>
            {t('leave_request.selected_dates')} ({tempSelectedDates.length})
          </Text>
          <TouchableOpacity onPress={clearAllDates} style={styles.clearAllButton}>
            <RotateCcw size={16} color="#F44336" />
            <Text style={styles.clearAllText}>{t('common.clear')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.datesScrollView}
        >
          <View style={styles.datesContainer}>
            {Object.entries(groupedTempDates).map(([monthYear, dates]) => (
              <View key={monthYear} style={styles.monthGroup}>
                <Text style={styles.monthLabel}>{monthYear}</Text>
                <View style={styles.monthDates}>
                  {dates.map(date => (
                    <TouchableOpacity
                      key={date}
                      style={styles.selectedDateChip}
                      onPress={() => selectionMode === 'multiple' ? removeDateFromSelection(date) : undefined}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectedDateText}>
                        {new Date(date).getDate()}
                      </Text>
                      {selectionMode === 'multiple' && (
                        <View style={styles.removeButton}>
                          <X size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

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
          selectedDates.length === 0 && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {getDisplayText()}
        </Text>
        {selectedDates.length > 0 && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>{selectedDates.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Selected Dates Summary (when not in modal) */}
      {selectedDates.length > 1 && (
        <View style={styles.selectedDatesSummary}>
          <Text style={styles.summaryTitle}>{t('leave_request.selected_dates')}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.summaryDates}>
              {Object.entries(groupedDates).map(([monthYear, dates]) => (
                <View key={monthYear} style={styles.summaryMonthGroup}>
                  <Text style={styles.summaryMonthLabel}>{monthYear}</Text>
                  <Text style={styles.summaryDatesText}>
                    {dates.map(d => new Date(d.date).getDate()).join(', ')}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showCalendar}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {t('leave_request.select_leave_dates')}
              </Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Mode Selection */}
            <View style={styles.modeSelector}>
              <Text style={styles.modeSelectorLabel}>{t('leave_request.selection_mode')}</Text>
              <View style={styles.modeOptions}>
                {[
                  { key: 'single', label: t('leave_request.single_day'), icon: '📅' },
                  { key: 'range', label: t('leave_request.date_range'), icon: '📆' },
                  { key: 'multiple', label: t('leave_request.multiple_dates'), icon: '🗓️' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modeOption,
                      selectionMode === option.key && styles.activeModeOption
                    ]}
                    onPress={() => handleModeChange(option.key as DateSelectionMode)}
                  >
                    <Text style={styles.modeOptionEmoji}>{option.icon}</Text>
                    <Text style={[
                      styles.modeOptionText,
                      selectionMode === option.key && styles.activeModeOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {getInstructionText()}
              </Text>
              
              {selectionMode === 'multiple' && (
                <Text style={styles.instructionsSubtext}>
                  {t('leave_request.max_selections', { max: maxSelections })} • {t('leave_request.tap_to_remove')}
                </Text>
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
              markingType={selectionMode === 'range' ? 'period' : 'simple'}
              markedDates={getMarkedDates()}
              enableSwipeMonths={true}
              hideExtraDays={true}
              firstDay={1}
              onMonthChange={(month) => setCurrentMonth(`${month.year}-${month.month.toString().padStart(2, '0')}`)}
            />

            {/* Selected Dates Preview */}
            {renderSelectedDatesPreview()}

            {/* Quick Actions for Multiple Mode */}
            {selectionMode === 'multiple' && (
              <View style={styles.quickActions}>
                <Text style={styles.quickActionsTitle}>{t('leave_request.quick_actions')}</Text>
                <View style={styles.quickActionButtons}>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                      // Add all Fridays in current month
                      const year = parseInt(currentMonth.split('-')[0]);
                      const month = parseInt(currentMonth.split('-')[1]) - 1;
                      const fridays = [];
                      
                      for (let day = 1; day <= 31; day++) {
                        const date = new Date(year, month, day);
                        if (date.getMonth() === month && date.getDay() === 5) {
                          const dateString = date.toISOString().split('T')[0];
                          if (dateString >= defaultMinDate && !tempSelectedDates.includes(dateString)) {
                            fridays.push(dateString);
                          }
                        }
                      }
                      
                      if (fridays.length > 0) {
                        setTempSelectedDates(prev => [...prev, ...fridays].sort());
                      }
                    }}
                  >
                    <Text style={styles.quickActionText}>{t('leave_request.add_all_fridays')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                      // Add all Mondays in current month
                      const year = parseInt(currentMonth.split('-')[0]);
                      const month = parseInt(currentMonth.split('-')[1]) - 1;
                      const mondays = [];
                      
                      for (let day = 1; day <= 31; day++) {
                        const date = new Date(year, month, day);
                        if (date.getMonth() === month && date.getDay() === 1) {
                          const dateString = date.toISOString().split('T')[0];
                          if (dateString >= defaultMinDate && !tempSelectedDates.includes(dateString)) {
                            mondays.push(dateString);
                          }
                        }
                      }
                      
                      if (mondays.length > 0) {
                        setTempSelectedDates(prev => [...prev, ...mondays].sort());
                      }
                    }}
                  >
                    <Text style={styles.quickActionText}>{t('leave_request.add_all_mondays')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllDates}
              >
                <Trash2 size={16} color="#F44336" />
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
                  tempSelectedDates.length === 0 && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={tempSelectedDates.length === 0}
              >
                <Check size={16} color="white" />
                <Text style={styles.confirmButtonText}>
                  {t('common.confirm')} ({tempSelectedDates.length})
                </Text>
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
  selectionBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  selectedDatesSummary: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  summaryDates: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryMonthGroup: {
    alignItems: 'center',
  },
  summaryMonthLabel: {
    fontSize: 10,
    color: '#1565C0',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryDatesText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
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
    maxHeight: '90%',
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
  modeSelector: {
    marginBottom: 16,
  },
  modeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modeOptions: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeModeOption: {
    backgroundColor: '#4A90E2',
  },
  modeOptionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  modeOptionText: {
    fontSize: 12,
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
  instructionsSubtext: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
  },
  calendar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 16,
  },
  selectedDatesPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    maxHeight: 120,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '500',
  },
  datesScrollView: {
    maxHeight: 80,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  monthGroup: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  monthDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: 100,
  },
  selectedDateChip: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'relative',
    minWidth: 28,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 6,
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
    flex: 2,
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