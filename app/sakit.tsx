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
import { ArrowLeft, Heart, Plus, X, Upload, Trash2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, Camera, File } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { sickLeaveService, SickLeaveRequest } from '@/services/sickLeave';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { SickLeaveDetailModal } from '@/components/SickLeaveDetailModal';
import { SickLeaveCard } from '@/components/SickLeaveCard';
import { useTranslation } from 'react-i18next';
import { imageService } from '@/services/imageService';
import * as DocumentPicker from 'expo-document-picker';
import { DateRangePicker } from '@/components/DateRangePicker';

interface FormData {
  selectedDate: string | null;
  reason: string;
  attachments: string[];
}

export default function SakitScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sickLeaveRequests, setSickLeaveRequests] = useState<SickLeaveRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSickLeave, setSelectedSickLeave] = useState<SickLeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    selectedDate: null,
    reason: '',
    attachments: [],
  });

  React.useEffect(() => {
    loadSickLeaveRequests();
  }, []);

  const loadSickLeaveRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { requests, error } = await sickLeaveService.getUserSickLeaveRequests(user.id);
      
      if (error) {
        Alert.alert(t('common.error'), error);
      } else {
        setSickLeaveRequests(requests);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('sick_leave.validation.submit_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSickLeaveRequests();
    setRefreshing(false);
  };

  const validateForm = (): boolean => {
    if (!formData.selectedDate) {
      Alert.alert(t('common.error'), t('sick_leave.validation.select_date'));
      return false;
    }

    // Validate date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(formData.selectedDate);
    if (isNaN(selectedDate.getTime()) || selectedDate < today) {
      Alert.alert(t('common.error'), t('sick_leave.validation.invalid_date'));
      return false;
    }

    if (!formData.reason.trim()) {
      Alert.alert(t('common.error'), t('sick_leave.validation.provide_reason'));
      return false;
    }

    if (formData.reason.trim().length < 10) {
      Alert.alert(t('common.error'), t('sick_leave.validation.reason_min_length'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('sick_leave.validation.user_not_authenticated'));
      return;
    }

    if (!validateForm()) return;

    console.log('Submitting sick leave request:', {
      userId: user.id,
      selectedDate: formData.selectedDate,
      reason: formData.reason.substring(0, 50) + '...',
      attachmentCount: formData.attachments.length
    });

    setIsSubmitting(true);
    setLoadingMessage(t('sick_leave.submitting_request'));

    try {
      // Step 1: Upload attachments if any
      if (formData.attachments.length > 0) {
        setLoadingMessage(t('sick_leave.uploading_attachments'));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Create sick leave request
      setLoadingMessage(t('sick_leave.processing_request'));
      const { request, error } = await sickLeaveService.createSickLeaveRequest({
        userId: user.id,
        selectedDate: formData.selectedDate!,
        reason: formData.reason.trim(),
        attachmentUris: formData.attachments,
      });

      if (error) {
        Alert.alert(t('common.error'), error);
        return;
      }

      // Step 3: Success handling
      setLoadingMessage('');
      Alert.alert(
        t('common.success'),
        t('sick_leave.sick_leave_submitted'),
        [{ text: t('common.ok'), onPress: () => {
          setShowModal(false);
          resetForm();
          loadSickLeaveRequests();
        }}]
      );
    } catch (error) {
      setLoadingMessage('');
      Alert.alert(t('common.error'), t('sick_leave.validation.submit_failed'));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  };

  const resetForm = () => {
    setFormData({
      selectedDate: null,
      reason: '',
      attachments: [],
    });
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

  const handleSickLeavePress = (request: SickLeaveRequest) => {
    setSelectedSickLeave(request);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSickLeave(null);
  };

  const handleCameraCapture = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert(t('sick_leave.permission_required'), t('sick_leave.camera_permission_required'));
        return;
      }
      
      const result = await imageService.captureFromCamera({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert(t('sick_leave.camera_error'), result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        handleImageSelected(result.uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('sick_leave.capture_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallerySelection = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert(t('sick_leave.permission_required'), t('sick_leave.media_permission_required'));
        return;
      }
      
      const result = await imageService.selectFromGallery({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert(t('sick_leave.gallery_error'), result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        handleImageSelected(result.uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('sick_leave.select_error'));
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
        
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert(
            t('sick_leave.file_too_large'),
            t('sick_leave.file_size_limit')
          );
          return;
        }

        handleImageSelected(asset.uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('sick_leave.document_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      t('sick_leave.add_attachment_title'),
      t('sick_leave.add_attachment_message'),
      [
        {
          text: t('sick_leave.camera'),
          onPress: handleCameraCapture,
          style: 'default',
        },
        {
          text: t('sick_leave.photo_gallery'),
          onPress: handleGallerySelection,
          style: 'default',
        },
        {
          text: t('sick_leave.document'),
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
        colors={['#F44336', '#D32F2F']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('sick_leave.sick_leave')}</Text>
          <View style={{ width: 40 }} />
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
            <Heart size={20} color="#F44336" />
            <Text style={styles.statValue}>{sickLeaveRequests.length}</Text>
            <Text style={styles.statLabel}>{t('sick_leave.total_requests')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={20} color="#FF9800" />
            <Text style={styles.statValue}>
              {sickLeaveRequests.filter(r => r.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>{t('sick_leave.pending')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <CheckCircle size={20} color="#4CAF50" />
            <Text style={styles.statValue}>
              {sickLeaveRequests.filter(r => r.status === 'approved').length}
            </Text>
            <Text style={styles.statLabel}>{t('sick_leave.approved')}</Text>
          </View>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.menuButtonText}>{t('sick_leave.create_request')}</Text>
        </TouchableOpacity>

        {/* Sick Leave Requests List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sick_leave.recent_sick_leave_requests')}</Text>
          
          {isLoading ? (
            <LoadingSpinner text={t('sick_leave.loading_requests')} />
          ) : sickLeaveRequests.length === 0 ? (
            <EmptyState
              icon={<Heart size={48} color="#E0E0E0" />}
              title={t('sick_leave.no_requests_yet')}
              message={t('sick_leave.start_creating_request')}
              actionText={t('sick_leave.create_request')}
              onAction={() => setShowModal(true)}
            />
          ) : (
            sickLeaveRequests.map((request) => (
              <SickLeaveCard
                key={request.id}
                request={request}
                onPress={handleSickLeavePress}
                showActions={true}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Sick Leave Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('sick_leave.sick_leave_form')}</Text>
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
              {/* Date Selection */}
              <Text style={styles.inputLabel}>{t('sick_leave.sick_date')}</Text>
              <DateRangePicker
                startDate={formData.selectedDate}
                endDate={formData.selectedDate}
                onDateRangeChange={(startDate, endDate) => {
                  setFormData(prev => ({ ...prev, selectedDate: startDate }));
                }}
                placeholder={t('sick_leave.select_date')}
                minDate={new Date().toISOString().split('T')[0]}
                allowSingleDay={true}
                defaultMode="single"
              />

              {/* Reason */}
              <Text style={styles.inputLabel}>{t('sick_leave.reason_description')}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t('sick_leave.explain_sick_reason')}
                value={formData.reason}
                onChangeText={(text) => setFormData(prev => ({ ...prev, reason: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              <Text style={styles.characterCount}>
                {t('sick_leave.character_count', { count: formData.reason.length })}
              </Text>

              {/* Attachments */}
              <Text style={styles.inputLabel}>{t('sick_leave.attachments_optional')}</Text>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handleAttachmentPress}
                disabled={isProcessing}
              >
                <Upload size={20} color="#F44336" />
                <Text style={styles.attachmentButtonText}>{t('sick_leave.add_attachment')}</Text>
              </TouchableOpacity>

              {/* Attachment Preview */}
              {formData.attachments.length > 0 && (
                <View style={styles.attachmentPreviewContainer}>
                  <Text style={styles.attachmentPreviewTitle}>
                    {t('sick_leave.attachment_selected', { count: formData.attachments.length })}
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
                <AlertCircle size={16} color="#F44336" />
                <Text style={styles.infoText}>
                  {t('sick_leave.info_notes')}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelButtonText, isSubmitting && styles.disabledButtonText]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={[styles.submitButtonText, isSubmitting && styles.disabledButtonText]}>
                  {isSubmitting ? t('common.processing') : t('sick_leave.submit_sick_leave')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {isSubmitting && (
              <View style={styles.loadingOverlay}>
                <LoadingSpinner 
                  text={loadingMessage || t('common.loading')} 
                  overlay={true}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Sick Leave Detail Modal */}
      <SickLeaveDetailModal
        visible={showDetailModal}
        onClose={closeDetailModal}
        sickLeaveRequest={selectedSickLeave}
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
    maxHeight: 900,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 4,
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
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  attachmentButtonText: {
    fontSize: 16,
    color: '#F44336',
    marginLeft: 8,
    fontWeight: '500',
  },
  attachmentPreviewContainer: {
    marginBottom: 16,
  },
  attachmentPreviewTitle: {
    fontSize: 14,
    color: '#F44336',
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
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#D32F2F',
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
    backgroundColor: '#F44336',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  menuButtonText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
});