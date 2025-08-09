import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, FileText, Plus, X, Upload, Trash2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, Camera, File } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { leaveRequestsService, LeaveRequest } from '@/services/leaveRequest';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { imageService } from '@/services/imageService';
import * as DocumentPicker from 'expo-document-picker';

interface FormData {
  leaveType: 'full_day' | 'half_day';
  leaveDate: string;
  description: string;
  attachments: string[];
}

export default function AjukanIzinScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    leaveType: 'full_day',
    leaveDate: '',
    description: '',
    attachments: [],
  });

  React.useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { requests, error } = await leaveRequestsService.getUserLeaveRequests(user.id);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        setLeaveRequests(requests);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaveRequests();
    setRefreshing(false);
  };

  const validateForm = (): boolean => {
    if (!formData.leaveDate) {
      Alert.alert('Error', 'Please select a leave date');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please provide a description for your leave request');
      return false;
    }

    if (formData.description.trim().length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters long');
      return false;
    }

    // Check if date is in the future
    const selectedDate = new Date(formData.leaveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert('Error', 'Leave date must be today or in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { request, error } = await leaveRequestsService.createLeaveRequest({
        userId: user.id,
        leaveType: formData.leaveType,
        leaveDate: formData.leaveDate,
        description: formData.description.trim(),
        attachmentUris: formData.attachments,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert(
        'Success',
        'Your leave request has been submitted successfully!',
        [{ text: 'OK', onPress: () => {
          setShowModal(false);
          resetForm();
          loadLeaveRequests();
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leaveType: 'full_day',
      leaveDate: '',
      description: '',
      attachments: [],
    });
  };

  const handleDateSelect = () => {
    // For demo purposes, set a future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    setFormData(prev => ({ ...prev, leaveDate: dateString }));
  };

  const handleImageSelected = (uri: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, uri],
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleCameraCapture = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
      
      const result = await imageService.captureFromCamera({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert('Camera Error', result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        handleImageSelected(result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo from camera');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallerySelection = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert('Permission Required', 'Media library permission is required to select photos');
        return;
      }
      
      const result = await imageService.selectFromGallery({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert('Gallery Error', result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        handleImageSelected(result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo from gallery');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentSelection = async () => {
    try {
      setIsProcessing(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'text/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size
        if (asset.size && asset.size > 10 * 1024 * 1024) { // 10MB default
          Alert.alert(
            'File Too Large',
            `File size must be less than 10MB`
          );
          return;
        }

        handleImageSelected(asset.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      'Add Attachment',
      'Choose how you want to add your file',
      [
        {
          text: 'Camera',
          onPress: handleCameraCapture,
          style: 'default',
        },
        {
          text: 'Photo Gallery',
          onPress: handleGallerySelection,
          style: 'default',
        },
        {
          text: 'Document',
          onPress: handleDocumentSelection,
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {},
      }
    );
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
        return <X size={16} color="#F44336" />;
      case 'pending':
        return <Clock size={16} color="#FF9800" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return type === 'full_day' ? 'Full Day' : 'Half Day';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          <Text style={styles.headerTitle}>Ajukan Izin</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FileText size={20} color="#4A90E2" />
            <Text style={styles.statValue}>{leaveRequests.length}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={20} color="#FF9800" />
            <Text style={styles.statValue}>
              {leaveRequests.filter(r => r.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={styles.statCard}>
            <CheckCircle size={20} color="#4CAF50" />
            <Text style={styles.statValue}>
              {leaveRequests.filter(r => r.status === 'approved').length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

        {/* Leave Requests List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Leave Requests</Text>
          
          {isLoading ? (
            <LoadingSpinner text="Loading leave requests..." />
          ) : leaveRequests.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} color="#E0E0E0" />}
              title="No leave requests yet"
              message="Start by creating your first leave request"
              actionText="Create Request"
              onAction={() => setShowModal(true)}
            />
          ) : (
            leaveRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestDate}>
                      {formatDate(request.leaveDate)}
                    </Text>
                    <View style={styles.requestMeta}>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: request.leaveType === 'full_day' ? '#E3F2FD' : '#FFF3E0' }
                      ]}>
                        <Text style={[
                          styles.typeBadgeText,
                          { color: request.leaveType === 'full_day' ? '#4A90E2' : '#FF9800' }
                        ]}>
                          {getLeaveTypeLabel(request.leaveType)}
                        </Text>
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
                </View>

                <Text style={styles.requestDescription}>
                  {request.description}
                </Text>

                {request.attachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    <Text style={styles.attachmentsLabel}>
                      {request.attachments.length} attachment(s)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.attachmentsList}>
                        {request.attachments.map((url, index) => (
                          <View key={index} style={styles.attachmentPreview}>
                            <File size={16} color="#4A90E2" />
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <View style={styles.requestFooter}>
                  <Text style={styles.submittedDate}>
                    Submitted: {request.submittedAt.toLocaleDateString()}
                  </Text>
                  {request.reviewedAt && (
                    <Text style={styles.reviewedDate}>
                      Reviewed: {request.reviewedAt.toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {request.reviewNotes && (
                  <View style={styles.reviewNotesContainer}>
                    <Text style={styles.reviewNotesLabel}>Review Notes:</Text>
                    <Text style={styles.reviewNotesText}>{request.reviewNotes}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Leave Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajukan Izin Baru</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Leave Type Selection */}
              <Text style={styles.inputLabel}>Jenis Izin</Text>
              <View style={styles.leaveTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.leaveTypeOption,
                    formData.leaveType === 'full_day' && styles.selectedLeaveType
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, leaveType: 'full_day' }))}
                >
                  <Calendar size={20} color={formData.leaveType === 'full_day' ? '#4A90E2' : '#666'} />
                  <Text style={[
                    styles.leaveTypeText,
                    formData.leaveType === 'full_day' && styles.selectedLeaveTypeText
                  ]}>
                    Full Day Leave
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leaveTypeOption,
                    formData.leaveType === 'half_day' && styles.selectedLeaveType
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, leaveType: 'half_day' }))}
                >
                  <Clock size={20} color={formData.leaveType === 'half_day' ? '#4A90E2' : '#666'} />
                  <Text style={[
                    styles.leaveTypeText,
                    formData.leaveType === 'half_day' && styles.selectedLeaveTypeText
                  ]}>
                    Half Day Leave
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Selection */}
              <Text style={styles.inputLabel}>Tanggal Izin</Text>
              <TouchableOpacity style={styles.dateInput} onPress={handleDateSelect}>
                <Calendar size={20} color="#666" />
                <Text style={[
                  styles.dateText,
                  !formData.leaveDate && styles.placeholderText
                ]}>
                  {formData.leaveDate 
                    ? new Date(formData.leaveDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select leave date'
                  }
                </Text>
              </TouchableOpacity>

              {/* Description */}
              <Text style={styles.inputLabel}>Alasan/Keterangan</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Jelaskan alasan pengajuan izin Anda..."
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              <Text style={styles.characterCount}>
                {formData.description.length}/500 characters
              </Text>

              {/* Attachments */}
              <Text style={styles.inputLabel}>Lampiran (Opsional)</Text>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handleAttachmentPress}
                disabled={isProcessing}
              >
                <Upload size={20} color="#4A90E2" />
                <Text style={styles.attachmentButtonText}>Add Attachment</Text>
              </TouchableOpacity>

              {/* Attachment Preview */}
              {formData.attachments.length > 0 && (
                <View style={styles.attachmentPreviewContainer}>
                  <Text style={styles.attachmentPreviewTitle}>
                    {formData.attachments.length} attachment(s) selected
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.attachmentPreviewList}>
                      {formData.attachments.map((uri, index) => (
                        <View key={index} style={styles.attachmentPreviewItem}>
                          <Image source={{ uri }} style={styles.attachmentPreviewImage} />
                          <TouchableOpacity
                            style={styles.removeAttachmentButton}
                            onPress={() => removeAttachment(index)}
                          >
                            <X size={12} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Info Note */}
              <View style={styles.infoNote}>
                <AlertCircle size={16} color="#4A90E2" />
                <Text style={styles.infoText}>
                  Pastikan semua informasi sudah benar sebelum mengajukan izin. 
                  Permintaan yang sudah diajukan tidak dapat diubah.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Ajukan Izin</Text>
                )}
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
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestHeader: {
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  attachmentsContainer: {
    marginBottom: 12,
  },
  attachmentsLabel: {
    fontSize: 12,
    color: '#4A90E2',
    marginBottom: 8,
  },
  attachmentsList: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentPreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  submittedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  reviewedDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewNotesContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  reviewNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  reviewNotesText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    maxHeight: 500,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  leaveTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  selectedLeaveType: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  leaveTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedLeaveTypeText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
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
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  attachmentButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  attachmentPreviewContainer: {
    marginBottom: 16,
  },
  attachmentPreviewTitle: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 12,
    fontWeight: '500',
  },
  attachmentPreviewList: {
    flexDirection: 'row',
    gap: 12,
  },
  attachmentPreviewItem: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachmentPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1565C0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
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
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
