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
import { Calendar, Clock, DollarSign, Plus, FileText, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { useAppContext } from '@/context/AppContext';

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const { state, createRequest } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'leave' | 'permission' | 'reimbursement'>('leave');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'leave':
        return '#E3F2FD';
      case 'permission':
        return '#E8F5E8';
      case 'reimbursement':
        return '#FFF3E0';
      default:
        return '#F8F9FA';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <Calendar size={20} color="#4A90E2" />;
      case 'permission':
        return <Clock size={20} color="#4CAF50" />;
      case 'reimbursement':
        return <DollarSign size={20} color="#FF9800" />;
      default:
        return <FileText size={20} color="#666" />;
    }
  };

  const handleSubmitRequest = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (selectedType === 'reimbursement' && !amount.trim()) {
      Alert.alert('Error', 'Please enter the reimbursement amount');
      return;
    }

    setIsSubmitting(true);
    
    const options: any = {};
    if (selectedType === 'reimbursement') {
      options.amount = parseFloat(amount);
    }
    
    createRequest(selectedType, title.trim(), description.trim(), options).then(({ error }) => {
      setIsSubmitting(false);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Your request has been submitted successfully!');
        setModalVisible(false);
        setTitle('');
        setDescription('');
        setAmount('');
      }
    });
  };

  const requestTypes = [
    { id: 'leave', label: 'Leave Request', icon: <Calendar size={24} color="#4A90E2" /> },
    { id: 'permission', label: 'Permission', icon: <Clock size={24} color="#4CAF50" /> },
    { id: 'reimbursement', label: 'Reimbursement', icon: <DollarSign size={24} color="#FF9800" /> },
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
          <View>
            <Text style={styles.headerTitle}>Requests</Text>
            <Text style={styles.headerSubtitle}>
              {state.requests.filter(r => r.status === 'pending').length} pending requests
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#4A90E2" />
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
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.requests.filter(r => r.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
            <View style={[styles.statIndicator, { backgroundColor: '#FF9800' }]} />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.requests.filter(r => r.status === 'approved').length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
            <View style={[styles.statIndicator, { backgroundColor: '#4CAF50' }]} />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.requests.filter(r => r.status === 'rejected').length}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
            <View style={[styles.statIndicator, { backgroundColor: '#F44336' }]} />
          </View>
        </View>

        {/* Request List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          
          {state.requests.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} color="#E0E0E0" />}
              title="No requests yet"
              message="Start by creating your first request"
              actionText="Create Request"
              onAction={() => setModalVisible(true)}
            />
          ) : (
            state.requests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              activeOpacity={0.7}
            >
              <View style={styles.requestHeader}>
                <View style={[styles.typeContainer, { backgroundColor: getTypeColor(request.type) }]}>
                  {getTypeIcon(request.type)}
                </View>
                
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>{request.title}</Text>
                  <Text style={styles.requestDescription}>{request.description}</Text>
                  <Text style={styles.requestDate}>
                    {request.startDate && request.endDate 
                      ? `${request.startDate} to ${request.endDate}`
                      : request.submittedAt.toLocaleDateString()
                    }
                  </Text>
                  {request.amount && (
                    <Text style={styles.requestAmount}>
                      Rp {request.amount.toLocaleString('id-ID')}
                    </Text>
                  )}
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
            </TouchableOpacity>
            ))
          )}
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
              <Text style={styles.modalTitle}>New Request</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <XCircle size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Request Type Selection */}
              <Text style={styles.inputLabel}>Request Type</Text>
              <View style={styles.typeSelection}>
                {requestTypes.map((type) => (
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

              {/* Description Input */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter request description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />

              {/* Amount Input (for reimbursement) */}
              {selectedType === 'reimbursement' && (
                <>
                  <Text style={styles.inputLabel}>Amount (IDR)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter amount"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </>
              )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  requestDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  requestAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
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