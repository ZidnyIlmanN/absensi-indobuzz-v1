import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, X, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
  mode?: 'date' | 'time' | 'datetime';
}

export function DatePickerModal({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  minimumDate,
  maximumDate,
  title = 'Select Date',
  mode = 'date',
}: DatePickerModalProps) {
  const [tempDate, setTempDate] = useState(selectedDate || new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date) {
      setTempDate(date);
      
      if (Platform.OS === 'android') {
        // On Android, immediately confirm the selection
        handleConfirm(date);
      }
    }
  };

  const handleConfirm = (dateToConfirm?: Date) => {
    const finalDate = dateToConfirm || tempDate;
    onDateSelect(finalDate);
    onClose();
  };

  const handleCancel = () => {
    setTempDate(selectedDate || new Date());
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(tempDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    // Check bounds
    if (minimumDate && newDate < minimumDate) return;
    if (maximumDate && newDate > maximumDate) return;
    
    setTempDate(newDate);
  };

  if (Platform.OS === 'android') {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.androidContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {showPicker && (
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="default"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.androidPicker}
              />
            )}
            
            {!showPicker && (
              <View style={styles.androidContent}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker(true)}
                >
                  <Calendar size={20} color="#4A90E2" />
                  <Text style={styles.dateButtonText}>
                    {formatDate(tempDate)}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.androidActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirm()}>
                    <Check size={16} color="white" />
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // iOS Modal
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.iosContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
            >
              <ChevronLeft size={20} color="#4A90E2" />
            </TouchableOpacity>
            
            <Text style={styles.monthYear}>
              {tempDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <ChevronRight size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedDateDisplay}>
            <Text style={styles.selectedDateLabel}>Selected Date:</Text>
            <Text style={styles.selectedDateText}>
              {formatDate(tempDate)}
            </Text>
          </View>

          <DateTimePicker
            value={tempDate}
            mode={mode}
            display="spinner"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            style={styles.iosPicker}
          />

          <View style={styles.iosActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirm()}>
              <Check size={16} color="white" />
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  androidContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  iosContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  selectedDateDisplay: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
    fontWeight: '500',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1',
    textAlign: 'center',
  },
  androidContent: {
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
    minWidth: 250,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    fontWeight: '500',
  },
  androidPicker: {
    width: '100%',
    marginBottom: 20,
  },
  iosPicker: {
    width: '100%',
    marginBottom: 20,
  },
  androidActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iosActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  cancelButtonText: {
    fontSize: 16,
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
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});