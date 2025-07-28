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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Receipt,
  Car,
  Coffee,
  Plane,
  Upload,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';

export default function ReimburseScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'travel' | 'meal' | 'accommodation' | 'other'>('travel');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const reimbursements = [
    {
      id: '1',
      category: 'travel',
      title: 'Client Meeting Transportation',
      description: 'Taxi fare to client office',
      amount: 150000,
      status: 'approved',
      submittedAt: '2024-02-08',
      receiptUrl: 'https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg',
    },
    {
      id: '2',
      category: 'meal',
      title: 'Business Lunch',
      description: 'Lunch with potential client',
      amount: 250000,
      status: 'pending',
      submittedAt: '2024-02-10',
      receiptUrl: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
    },
    {
      id: '3',
      category: 'accommodation',
      title: 'Hotel Stay',
      description: 'Business trip to Surabaya',
      amount: 800000,
      status: 'rejected',
      submittedAt: '2024-02-05',
      receiptUrl: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
      rejectionReason: 'Receipt not clear enough',
    },
  ];

  const monthlyStats = {
    submitted: 1200000,
    approved: 900000,
    pending: 250000,
    rejected: 50000,
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel':
        return <Car size={20} color="#4A90E2" />;
      case 'meal':
        return <Coffee size={20} color="#FF9800" />;
      case 'accommodation':
        return <Plane size={20} color="#9C27B0" />;
      default:
        return <Receipt size={20} color="#666" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'travel':
        return '#E3F2FD';
      case 'meal':
        return '#FFF3E0';
      case 'accommodation':
        return '#F3E5F5';
      default:
        return '#F8F9FA';
    }
  };

  const handleTakePhoto = () => {
    Alert.alert(
      'Add Receipt',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => {
            // Simulate camera capture
            setReceipt('https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg');
            Alert.alert('Success', 'Receipt photo captured!');
          }
        },
        { 
          text: 'Gallery', 
          onPress: () => {
            // Simulate gallery selection
            setReceipt('https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg');
            Alert.alert('Success', 'Receipt photo selected!');
          }
        },
      ]
    );
  };

  const handleSubmitReimbursement = () => {
    if (!title.trim() || !description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!receipt) {
      Alert.alert('Error', 'Please attach a receipt');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const newReimbursement = {
        id: Date.now().toString(),
        userId: state.user?.id || '',
        type: 'reimbursement' as const,
        title: title.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        status: 'pending' as const,
        submittedAt: new Date(),
      };

      dispatch({ type: 'ADD_REQUEST', payload: newReimbursement });
      setIsSubmitting(false);
      Alert.alert('Success', 'Your reimbursement request has been submitted successfully!');
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setAmount('');
      setReceipt(null);
    }, 1500);
  };

  const categories = [
    { id: 'travel', label: 'Travel', icon: <Car size={24} color="#4A90E2" /> },
    { id: 'meal', label: 'Meals', icon: <Coffee size={24} color="#FF9800" /> },
    { id: 'accommodation', label: 'Accommodation', icon: <Plane size={24} color="#9C27B0" /> },
    { id: 'other', label: 'Other', icon: <Receipt size={24} color="#666" /> },
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
          <Text style={styles.headerTitle}>Reimbursement</Text>
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
        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <DollarSign size={20} color="#4A90E2" />
              <Text style={styles.statValue}>
                Rp {monthlyStats.submitted.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            
            <View style={styles.statCard}>
              <CheckCircle size={20} color="#4CAF50" />
              <Text style={styles.statValue}>
                Rp {monthlyStats.approved.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <AlertCircle size={20} color="#FF9800" />
              <Text style={styles.statValue}>
                Rp {monthlyStats.pending.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            
            <View style={styles.statCard}>
              <XCircle size={20} color="#F44336" />
              <Text style={styles.statValue}>
                Rp {monthlyStats.rejected.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Recent Reimbursements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          
          {reimbursements.map((reimbursement) => (
            <View key={reimbursement.id} style={styles.reimbursementCard}>
              <View style={styles.reimbursementHeader}>
                <View style={[
                  styles.categoryContainer, 
                  { backgroundColor: getCategoryColor(reimbursement.category) }
                ]}>
                  {getCategoryIcon(reimbursement.category)}
                </View>
                
                <View style={styles.reimbursementInfo}>
                  <Text style={styles.reimbursementTitle}>{reimbursement.title}</Text>
                  <Text style={styles.reimbursementDescription}>{reimbursement.description}</Text>
                  <Text style={styles.reimbursementAmount}>
                    Rp {reimbursement.amount.toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.reimbursementDate}>
                    {new Date(reimbursement.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.statusContainer}>
                  {getStatusIcon(reimbursement.status)}
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(reimbursement.status) }
                  ]}>
                    {reimbursement.status.charAt(0).toUpperCase() + reimbursement.status.slice(1)}
                  </Text>
                </View>
              </View>

              {reimbursement.receiptUrl && (
                <View style={styles.receiptContainer}>
                  <Text style={styles.receiptLabel}>Receipt:</Text>
                  <Image source={{ uri: reimbursement.receiptUrl }} style={styles.receiptImage} />
                </View>
              )}

              {reimbursement.status === 'rejected' && reimbursement.rejectionReason && (
                <View style={styles.rejectionContainer}>
                  <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                  <Text style={styles.rejectionReason}>{reimbursement.rejectionReason}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Reimbursement Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reimbursement</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <XCircle size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Selection */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelection}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id && styles.categoryOptionSelected
                    ]}
                    onPress={() => setSelectedCategory(category.id as any)}
                  >
                    {category.icon}
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category.id && styles.categoryOptionTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter expense title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />

              {/* Amount Input */}
              <Text style={styles.inputLabel}>Amount (IDR)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              {/* Description Input */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter expense description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />

              {/* Receipt Upload */}
              <Text style={styles.inputLabel}>Receipt</Text>
              <TouchableOpacity style={styles.receiptUpload} onPress={handleTakePhoto}>
                {receipt ? (
                  <Image source={{ uri: receipt }} style={styles.receiptPreview} />
                ) : (
                  <View style={styles.receiptPlaceholder}>
                    <Camera size={32} color="#999" />
                    <Text style={styles.receiptPlaceholderText}>Tap to add receipt</Text>
                  </View>
                )}
              </TouchableOpacity>
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
                onPress={handleSubmitReimbursement}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  reimbursementCard: {
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
  reimbursementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reimbursementInfo: {
    flex: 1,
  },
  reimbursementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reimbursementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reimbursementAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  reimbursementDate: {
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
  receiptContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  receiptImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  rejectionContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#D32F2F',
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
  categorySelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
    marginBottom: 8,
    minWidth: '45%',
  },
  categoryOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  categoryOptionTextSelected: {
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
  receiptUpload: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  receiptPlaceholder: {
    alignItems: 'center',
  },
  receiptPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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