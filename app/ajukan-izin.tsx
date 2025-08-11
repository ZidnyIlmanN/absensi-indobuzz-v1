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
import { leaveRequestsService, LeaveRequest } from '@/services/leaveRequests';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { LeaveRequestDetailModal } from '@/components/LeaveRequestDetailModal';
import { LeaveRequestCard } from '@/components/LeaveRequestCard';
import { useTranslation } from 'react-i18next';
import { imageService } from '@/services/imageService';
import * as DocumentPicker from 'expo-document-picker';
import { DateRangePicker } from '@/components/DateRangePicker';

interface FormData {
  leaveType: 'full_day' | 'half_day';
  startDate: string;
  endDate: string;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    leaveType: 'full_day',
    startDate: '',
    endDate: '',
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
        Alert.alert(t('common.error'), error);
      } else {
        setLeaveRequests(requests);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('leave_request.validation.submit_failed'));
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
    if (!formData.startDate || !formData.endDate) {
      Alert.alert(t('common.error'), t('leave_request.validation.select_date_range'));
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert(t('common.error'), t('leave_request.validation.provide_description'));
      return false;
    }

    if (formData.description.trim().length < 10) {
      Alert.alert(t('common.error'), t('leave_request.validation.description_min_length'));
      return false;
    }

    // Check if date is in the future
    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      Alert.alert(t('common.error'), t('leave_request.validation.future_date'));
      return false;
    }

    // Validate end date is not before start date
    const endDate = new Date(formData.endDate);
    if (endDate < startDate) {
      Alert.alert(t('common.error'), t('leave_request.validation.end_date_after_start'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('leave_request.validation.user_not_authenticated'));
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { request, error } = await leaveRequestsService.createLeaveRequest({
        userId: user.id,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim(),
        attachmentUris: formData.attachments,
      });

      if (error) {
        Alert.alert(t('common.error'), error);
        return;
      }

      Alert.alert(
        t('common.success'),
        t('leave_request.leave_request_submitted'),
        [{ text: t('common.ok'), onPress: () => {
          setShowModal(false);
          resetForm();
          loadLeaveRequests();
        }}]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('leave_request.validation.submit_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leaveType: 'full_day',
      startDate: '',
      endDate: '',
      description: '',
      attachments: [],
    });
  };

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setFormData(prev => ({
      ...prev,
      startDate: startDate || '',
      endDate: endDate || '',
    }));
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

  const handleLeaveRequestPress = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedLeaveRequest(null);
  };

  const handleCameraCapture = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert(t('leave_request.permission_required'), t('leave_request.camera_permission_required'));
        return;
      }
      
      const result = await imageService.captureFromCamera({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert(t('leave_request.camera_error'), result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        handleImageSelected(result.uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('leave_request.capture_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallerySelection = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert(t('leave_request.permission_required'), t('leave_request.media_permission_required'));
        return;
      }
      
      const result = await imageService.selectFromGallery({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert(t('leave_request.gallery_error'), result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        handleImageSelected(result.uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('leave_request.select_error'));
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
            t('leave_request.file_too_large'),
            t('leave_request.file_size_limit')
          );
          return;
        }

        handleImageSelected(asset.uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('leave_request.document_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      t('leave_request.add_attachment_title'),
      t('leave_request.add_attachment_message'),
      [
        {
          text: t('leave_request.camera'),
          onPress: handleCameraCapture,
          style: 'default',
        },
        {
          text: t('leave_request.photo_gallery'),
          onPress: handleGallerySelection,
          style: 'default',
        },
        {
          text: t('leave_request.document'),
          onPress: handleDocumentSelection,
          style: 'default',
        },
        {
          text: t('common.cancel'),
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

  const calculateLeaveDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(0, diffDays);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (startDate === endDate) {
      return start.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    return `${start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
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
    return type === 'full_day' ? t('leave_request.full_day') : t('leave_request.half_day');
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
          <Text style={styles.headerTitle}>{t('leave_request.ajukan_izin')}</Text>
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
            <Text style={styles.statLabel}>{t('leave_request.total_requests')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={20} color="#FF9800" />
            <Text style={styles.statValue}>
              {leaveRequests.filter(r => r.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>{t('leave_request.pending')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <CheckCircle size={20} color="#4CAF50" />
            <Text style={styles.statValue}>
              {leaveRequests.filter(r => r.status === 'approved').length}
            </Text>
            <Text style={styles.statLabel}>{t('leave_request.approved')}</Text>
          </View>
        </View>

        {/* Leave Requests List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('leave_request.recent_leave_requests')}</Text>
          
          {isLoading ? (
            <LoadingSpinner text={t('leave_request.loading_requests')} />
          ) : leaveRequests.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} color="#E0E0E0" />}
              title={t('leave_request.no_requests_yet')}
              message={t('leave_request.start_creating_request')}
              actionText={t('leave_request.create_request')}
              onAction={() => setShowModal(true)}
            />
          ) : (
            leaveRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                onPress={handleLeaveRequestPress}
                showActions={true}
              />
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
              <Text style={styles.modalTitle}>{t('leave_request.leave_request_form')}</Text>
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
              <Text style={styles.inputLabel}>{t('leave_request.leave_type')}</Text>
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
                    {t('leave_request.full_day_leave')}
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
                    {t('leave_request.half_day_leave')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Selection */}
              <Text style={styles.inputLabel}>{t('leave_request.leave_date_range')}</Text>
              <DateRangePicker
                startDate={formData.startDate}
                endDate={formData.endDate}
                onDateRangeChange={handleDateRangeChange}
                placeholder={t('leave_request.select_date_range')}
                minDate={new Date().toISOString().split('T')[0]}
              />
              
              {/* Duration Display */}
              {formData.startDate && formData.endDate && (
                <View style={styles.durationDisplay}>
                  <Text style={styles.durationLabel}>{t('leave_request.total_duration')}:</Text>
                  <Text style={styles.durationValue}>
                    {calculateLeaveDuration()} {calculateLeaveDuration() === 1 ? t('leave_request.day') : t('leave_request.days')}
                  </Text>
                </View>
              )}

              {/* Description */}
              <Text style={styles.inputLabel}>{t('leave_request.description_reason')}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t('leave_request.explain_leave_reason')}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              <Text style={styles.characterCount}>
                {t('leave_request.character_count', { count: formData.description.length })}
              </Text>

              {/* Attachments */}
              <Text style={styles.inputLabel}>{t('leave_request.attachments_optional')}</Text>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handleAttachmentPress}
                disabled={isProcessing}
              >
                <Upload size={20} color="#4A90E2" />
                <Text style={styles.attachmentButtonText}>{t('leave_request.add_attachment')}</Text>
              </TouchableOpacity>

              {/* Attachment Preview */}
              {formData.attachments.length > 0 && (
                <View style={styles.attachmentPreviewContainer}>
                  <Text style={styles.attachmentPreviewTitle}>
                    {t('leave_request.attachment_selected', { count: formData.attachments.length })}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.attachmentPreviewList}>
                      {formData.attachments.map((url, index) => (
                        <View key={index} style={styles.attachmentPreviewItem}>
                          <Image source={{ uri: url }} style={styles.attachmentPreviewImage} />
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
                  {t('leave_request.info_notes')}
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
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('leave_request.submit_leave_request')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leave Request Detail Modal */}
      <LeaveRequestDetailModal
        visible={showDetailModal}
        onClose={closeDetailModal}
        leaveRequest={selectedLeaveRequest}
        isLoading={false}
      />
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
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  durationDates: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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