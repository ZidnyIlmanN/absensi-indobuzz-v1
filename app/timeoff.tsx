import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Plus, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Plane, Heart, Briefcase } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';

export default function TimeOffScreen() {
  const insets = useSafeAreaInsets();
  const { createRequest } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'annual' | 'sick' | 'personal'>('annual');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const leaveBalance = {
    annual: { used: 8, total: 20, remaining: 12 },
    sick: { used: 2, total: 12, remaining: 10 },
    personal: { used: 1, total: 5, remaining: 4 },
  };

  const leaveRequests = [
    {
      id: '1',
      type: 'annual',
      title: 'Family Vacation',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      days: 6,
      status: 'approved',
      reason: 'Family vacation to Bali',
      submittedAt: '2024-02-01',
    },
    {
      id: '2',
      type: 'sick',
      title: 'Medical Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      status: 'approved',
      reason: 'Flu and fever',
      submittedAt: '2024-01-19',
    },
    {
      id: '3',
      type: 'personal',
      title: 'Personal Matter',
      startDate: '2024-03-10',
      endDate: '2024-03-10',
      days: 1,
      status: 'pending',
      reason: 'Personal appointment',
      submittedAt: '2024-02-28',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'rejected':
        return <XCircle size={16} color="#F44336" />;
      case 'pending':
        return <AlertCircle size={16} color="#FF9800" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'annual':
        return <Plane size={20} color="#4A90E2" />;
      case 'sick':
        return <Heart size={20} color="#F44336" />;
      case 'personal':
        return <Briefcase size={20} color="#FF9800" />;
      default:
        return <Calendar size={20} color="#666" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return '#E3F2FD';
      case 'sick':
        return '#FFEBEE';
      case 'personal':
        return '#FFF3E0';
      default:
        return '#F8F9FA';
    }
  };

  const handleSubmitRequest = () => {
    if (!title.trim() || !reason.trim() || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(async () => {
      const { error } = await createRequest(
        'leave',
        title.trim(),
        reason.trim(),
        {
          type: selectedType,
          startDate,
          endDate,
        }
      );

      setIsSubmitting(false);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Your time off request has been submitted successfully!');
      }
      setModalVisible(false);
      setTitle('');
      setReason('');
      setStartDate('');
      setEndDate('');
    }, 1500);
  };

  const leaveTypes = [
    { id: 'annual', label: 'Annual Leave', icon: <Plane size={24} color="#4A90E2" /> },
    { id: 'sick', label: 'Sick Leave', icon: <Heart size={24} color="#F44336" /> },
    { id: 'personal', label: 'Personal Leave', icon: <Briefcase size={24} color="#FF9800" /> },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Off</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Leave Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          
          <View style={styles.balanceContainer}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Plane size={20} color="#4A90E2" />
                <Text style={styles.balanceType}>Annual Leave</Text>
              </View>
              <Text style={styles.balanceRemaining}>{leaveBalance.annual.remaining}</Text>
              <Text style={styles.balanceTotal}>of {leaveBalance.annual.total} days</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(leaveBalance.annual.used / leaveBalance.annual.total) * 100}%`,
                      backgroundColor: '#4A90E2'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Heart size={20} color="#F44336" />
                <Text style={styles.balanceType}>Sick Leave</Text>
              </View>
              <Text style={styles.balanceRemaining}>{leaveBalance.sick.remaining}</Text>
              <Text style={styles.balanceTotal}>of {leaveBalance.sick.total} days</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(leaveBalance.sick.used / leaveBalance.sick.total) * 100}%`,
                      backgroundColor: '#F44336'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Briefcase size={20} color="#FF9800" />
                <Text style={styles.balanceType}>Personal</Text>
              </View>
              <Text style={styles.balanceRemaining}>{leaveBalance.personal.remaining}</Text>
              <Text style={styles.balanceTotal}>of {leaveBalance.personal.total} days</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(leaveBalance.personal.used / leaveBalance.personal.total) * 100}%`,
                      backgroundColor: '#FF9800'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          
          {leaveRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={[styles.typeContainer, { backgroundColor: getTypeColor(request.type) }]}>
                  {getTypeIcon(request.type)}
                </View>
                
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>{request.title}</Text>
                  <Text style={styles.requestDates}>
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.requestDays}>{request.days} day{request.days > 1 ? 's' : ''}</Text>
                  <Text style={styles.requestReason}>{request.reason}</Text>
                </View>
                
                <View style={styles.statusContainer}>
                  {getStatusIcon(request.status)}
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(request.status) }
                  ]}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Time Off Request</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <XCircle size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Leave Type Selection */}
              <Text style={styles.inputLabel}>Leave Type</Text>
              <View style={styles.typeSelection}>
                {leaveTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      selectedType === type.id && styles.typeOptionSelected
                    ]}
                    onPress={() => setSelectedType(type.id as any)}
                  >
                    {type.icon}
                    <Text style={[
                      styles.typeOptionText,
                      selectedType === type.id && styles.typeOptionTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter request title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />

              {/* Date Inputs */}
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateInput}>
                <Calendar size={20} color="#666" />
                <Text style={styles.dateText}>
                  {startDate || 'Select start date'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateInput}>
                <Calendar size={20} color="#666" />
                <Text style={styles.dateText}>
                  {endDate || 'Select end date'}
                </Text>
              </TouchableOpacity>

              {/* Reason Input */}
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter reason for time off"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitRequest}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  balanceRemaining: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  balanceTotal: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  requestDates: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  requestDays: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  requestReason: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  typeSelection: {
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
  },
  typeOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  typeOptionTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});