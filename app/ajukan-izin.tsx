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
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, FileText, Plus, X, Upload, Trash2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, Camera, File, ChevronRight, Info, DollarSign, Users, MapPin } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { leaveRequestsService, LeaveRequest } from '@/services/leaveRequest';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { imageService } from '@/services/imageService';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PermitDetailModal } from '@/components/PermitDetailModal';

const { width } = Dimensions.get('window');

interface FormData {
  leaveType: 'full_day' | 'half_day';
  leaveDate: string;
  description: string;
  attachments: string[];
}

interface PermitType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
  requirements: string[];
  processingTime: string;
  requiredDocuments: string[];
  fees: string;
  applicationSteps: string[];
  eligibility: string[];
  notes?: string[];
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
  const [selectedPermitType, setSelectedPermitType] = useState<PermitType | null>(null);
  const [showPermitDetail, setShowPermitDetail] = useState(false);
  const [animatedValues] = useState(() => 
    Array.from({ length: 4 }, () => new Animated.Value(1))
  );

  const [formData, setFormData] = useState<FormData>({
    leaveType: 'full_day',
    leaveDate: '',
    description: '',
    attachments: [],
  });

  // Define permit types with detailed information
  const permitTypes: PermitType[] = [
    {
      id: 'annual_leave',
      title: t('leave_request.annual_leave'),
      description: 'Paid time off for vacation, personal matters, or rest',
      icon: <Calendar size={24} color="#4A90E2" />,
      color: '#4A90E2',
      backgroundColor: '#E3F2FD',
      requirements: [
        'Minimum 3 days advance notice',
        'Manager approval required',
        'Available leave balance',
        'No conflicting team schedules'
      ],
      processingTime: '2-3 business days',
      requiredDocuments: [
        'Leave application form',
        'Work handover document (if applicable)',
        'Travel itinerary (for vacation leave)'
      ],
      fees: 'Free',
      applicationSteps: [
        'Fill out the leave application form',
        'Attach required documents',
        'Submit for manager review',
        'Receive approval notification',
        'Enjoy your time off!'
      ],
      eligibility: [
        'Permanent employees',
        'Completed probation period',
        'Available leave balance',
        'No pending disciplinary actions'
      ],
      notes: [
        'Annual leave must be used within the calendar year',
        'Maximum 10 consecutive days without special approval',
        'Leave balance resets annually'
      ]
    },
    {
      id: 'sick_leave',
      title: t('leave_request.sick_leave'),
      description: 'Medical leave for illness or health-related issues',
      icon: <FileText size={24} color="#F44336" />,
      color: '#F44336',
      backgroundColor: '#FFEBEE',
      requirements: [
        'Medical certificate required (for >3 days)',
        'Immediate notification to supervisor',
        'Doctor\'s note for extended absence'
      ],
      processingTime: 'Immediate approval for emergency cases',
      requiredDocuments: [
        'Medical certificate',
        'Doctor\'s prescription (if applicable)',
        'Hospital discharge summary (if applicable)'
      ],
      fees: 'Free',
      applicationSteps: [
        'Notify supervisor immediately',
        'Submit sick leave application',
        'Provide medical documentation',
        'Receive automatic approval',
        'Focus on recovery'
      ],
      eligibility: [
        'All employees',
        'Valid medical documentation',
        'Genuine health condition'
      ],
      notes: [
        'Sick leave does not count against annual leave',
        'Extended sick leave may require HR review',
        'Return-to-work clearance may be required'
      ]
    },
    {
      id: 'emergency_leave',
      title: t('leave_request.emergency_leave'),
      description: 'Urgent leave for family emergencies or unforeseen circumstances',
      icon: <AlertCircle size={24} color="#FF9800" />,
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      requirements: [
        'Genuine emergency situation',
        'Immediate notification required',
        'Supporting documentation',
        'Manager discretion approval'
      ],
      processingTime: 'Same day approval for genuine emergencies',
      requiredDocuments: [
        'Emergency leave application',
        'Supporting evidence (hospital records, police report, etc.)',
        'Contact information for verification'
      ],
      fees: 'Free',
      applicationSteps: [
        'Contact supervisor immediately',
        'Explain emergency situation',
        'Submit application with evidence',
        'Receive expedited review',
        'Handle emergency situation'
      ],
      eligibility: [
        'All employees',
        'Genuine emergency circumstances',
        'Proper documentation available'
      ],
      notes: [
        'Emergency leave may be unpaid depending on circumstances',
        'False emergency claims may result in disciplinary action',
        'Company may verify emergency situations'
      ]
    },
    {
      id: 'maternity_paternity',
      title: t('leave_request.maternity_paternity'),
      description: 'Leave for childbirth, adoption, or family care',
      icon: <Users size={24} color="#9C27B0" />,
      color: '#9C27B0',
      backgroundColor: '#F3E5F5',
      requirements: [
        'Minimum 1 month advance notice',
        'Medical documentation required',
        'HR approval and coordination',
        'Minimum 6 months employment'
      ],
      processingTime: '1-2 weeks for processing',
      requiredDocuments: [
        'Medical certificate from doctor',
        'Expected delivery date confirmation',
        'Birth certificate (post-birth)',
        'Adoption papers (for adoption leave)'
      ],
      fees: 'Free',
      applicationSteps: [
        'Notify HR of pregnancy/adoption',
        'Submit maternity/paternity leave application',
        'Provide medical documentation',
        'Coordinate work handover',
        'Receive leave approval and benefits information'
      ],
      eligibility: [
        'Permanent employees',
        'Minimum 6 months employment',
        'Valid medical documentation',
        'Compliance with company policy'
      ],
      notes: [
        'Maternity leave: up to 3 months paid leave',
        'Paternity leave: up to 2 weeks paid leave',
        'Additional unpaid leave may be available',
        'Job protection guaranteed during leave'
      ]
    }
  ];

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

  const handlePermitTypePress = (permitType: PermitType, index: number) => {
    // Animate the pressed card
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show detailed view
    setSelectedPermitType(permitType);
    setShowPermitDetail(true);
  };

  const closePermitDetail = () => {
    setShowPermitDetail(false);
    setSelectedPermitType(null);
  };

  const handleApplyFromDetail = (permitType: PermitType) => {
    // Set the form type based on permit type
    const leaveTypeMapping: { [key: string]: 'full_day' | 'half_day' } = {
      annual_leave: 'full_day',
      sick_leave: 'full_day',
      emergency_leave: 'full_day',
      maternity_paternity: 'full_day',
    };

    setFormData(prev => ({
      ...prev,
      leaveType: leaveTypeMapping[permitType.id] || 'full_day',
    }));

    closePermitDetail();
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    if (!formData.leaveDate) {
      Alert.alert(t('common.error'), t('leave_request.validation.select_date'));
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
    const selectedDate = new Date(formData.leaveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert(t('common.error'), t('leave_request.validation.future_date'));
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
        leaveDate: formData.leaveDate,
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
      leaveDate: '',
      description: '',
      attachments: [],
    });
  };

  const handleDateSelect = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, leaveDate: dateString }));
    }
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

        {/* Permit Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('leave_request.permit_types')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('leave_request.select_permit_type_details')}
          </Text>
          
          <View style={styles.permitTypesGrid}>
            {permitTypes.map((permitType, index) => (
              <Animated.View
                key={permitType.id}
                style={[
                  styles.permitTypeCard,
                  { transform: [{ scale: animatedValues[index] }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.permitTypeButton,
                    { backgroundColor: permitType.backgroundColor }
                  ]}
                  onPress={() => handlePermitTypePress(permitType, index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.permitTypeHeader}>
                    <View style={[styles.permitTypeIcon, { backgroundColor: permitType.color }]}>
                      {permitType.icon}
                    </View>
                    <View style={styles.permitTypeInfo}>
                      <Text style={styles.permitTypeTitle}>{permitType.title}</Text>
                      <Text style={styles.permitTypeDescription}>
                        {permitType.description}
                      </Text>
                    </View>
                    <View style={styles.permitTypeAction}>
                      <Info size={16} color={permitType.color} />
                      <ChevronRight size={16} color={permitType.color} />
                    </View>
                  </View>
                  
                  <View style={styles.permitTypeFooter}>
                    <View style={styles.permitTypeDetail}>
                      <Clock size={12} color="#666" />
                      <Text style={styles.permitTypeDetailText}>
                        {permitType.processingTime}
                      </Text>
                    </View>
                    <View style={styles.permitTypeDetail}>
                      <DollarSign size={12} color="#666" />
                      <Text style={styles.permitTypeDetailText}>
                        {permitType.fees}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.tapToViewIndicator}>
                    <Text style={styles.tapToViewText}>
                      {t('leave_request.tap_for_details')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
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
                          {t(`leave_request.${request.status}`)}
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
                      {t('leave_request.attachments', { count: request.attachments.length })}
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
                    {t('leave_request.submitted')}: {request.submittedAt.toLocaleDateString()}
                  </Text>
                  {request.reviewedAt && (
                    <Text style={styles.reviewedDate}>
                      {t('leave_request.reviewed')}: {request.reviewedAt.toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {request.reviewNotes && (
                  <View style={styles.reviewNotesContainer}>
                    <Text style={styles.reviewNotesLabel}>{t('leave_request.review_notes')}:</Text>
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
              <Text style={styles.inputLabel}>{t('leave_request.leave_date')}</Text>
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
                    : t('leave_request.select_leave_date')
                  }
                </Text>
              </TouchableOpacity>

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

            {showDatePicker && (
              <DateTimePicker style={styles.datePickerWrapper}
                value={formData.leaveDate ? new Date(formData.leaveDate) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()} // Prevent selecting past dates
              />
            )}

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

      {/* Permit Detail Modal */}
      <PermitDetailModal
        visible={showPermitDetail}
        onClose={closePermitDetail}
        permitType={selectedPermitType}
        onApply={handleApplyFromDetail}
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
  permitTypesGrid: {
    gap: 16,
  },
  permitTypeCard: {
    marginBottom: 4,
  },
  permitTypeButton: {
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  permitTypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  permitTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  permitTypeInfo: {
    flex: 1,
  },
  permitTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  permitTypeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  permitTypeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  permitTypeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  permitTypeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  permitTypeDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  tapToViewIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tapToViewText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
  datePickerWrapper: {
    borderRadius: 8,
    margin: 20,
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