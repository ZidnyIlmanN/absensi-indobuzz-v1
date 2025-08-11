import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { X, Calendar, Clock, User, Building, FileText, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, MessageSquare, Download, Eye, ChevronRight } from 'lucide-react-native';
import { LeaveRequest } from '@/services/leaveRequests';
import { LoadingSpinner } from './LoadingSpinner';
import { useI18n } from '@/hooks/useI18n';
import { useAppContext } from '@/context/AppContext';
import { AttachmentPreview } from './AttachmentPreview';

const { width } = Dimensions.get('window');

interface LeaveRequestDetailModalProps {
  visible: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequest | null;
  isLoading?: boolean;
}

interface ApprovalStep {
  id: string;
  step: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approver?: string;
  approverRole?: string;
  timestamp?: Date;
  comments?: string;
}

export function LeaveRequestDetailModal({
  visible,
  onClose,
  leaveRequest,
  isLoading = false,
}: LeaveRequestDetailModalProps) {
  const { t, formatLeaveDate, formatLeaveDateShort, formatSubmissionDate } = useI18n();
  const { user } = useAppContext();
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  if (!leaveRequest && !isLoading) return null;

  const calculateDuration = () => {
    if (!leaveRequest) return 0;
    
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(0, diffDays);
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
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'rejected':
        return <XCircle size={20} color="#F44336" />;
      case 'pending':
        return <AlertCircle size={20} color="#FF9800" />;
      default:
        return <AlertCircle size={20} color="#9E9E9E" />;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return type === 'full_day' ? t('leave_request.full_day') : t('leave_request.half_day');
  };

  const getLeaveTypeColor = (type: string) => {
    return type === 'full_day' ? '#4A90E2' : '#FF9800';
  };

  // Mock approval workflow - in real app, this would come from backend
  const getApprovalWorkflow = (): ApprovalStep[] => {
    if (!leaveRequest) return [];

    const steps: ApprovalStep[] = [
      {
        id: '1',
        step: 1,
        title: 'Direct Supervisor',
        status: leaveRequest.status === 'rejected' ? 'rejected' : 
                leaveRequest.status === 'approved' ? 'approved' : 'pending',
        approver: 'John Manager',
        approverRole: 'Team Lead',
        timestamp: leaveRequest.reviewedAt,
        comments: leaveRequest.reviewNotes,
      },
    ];

    // Add HR step for longer leaves
    const duration = calculateDuration();
    if (duration > 3) {
      steps.push({
        id: '2',
        step: 2,
        title: 'HR Department',
        status: leaveRequest.status === 'approved' ? 'approved' : 'pending',
        approver: leaveRequest.status === 'approved' ? 'Sarah HR' : undefined,
        approverRole: 'HR Manager',
        timestamp: leaveRequest.status === 'approved' ? leaveRequest.reviewedAt : undefined,
      });
    }

    return steps;
  };

  const approvalSteps = getApprovalWorkflow();

  const handleAttachmentPress = (attachmentUrl: string) => {
    setSelectedAttachment(attachmentUrl);
    setShowAttachmentModal(true);
  };

  const handleDownloadAttachment = (attachmentUrl: string) => {
    Alert.alert(
      'Download Attachment',
      'Download functionality would be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const renderAttachmentPreview = (url: string, index: number) => {
    const isImage = url.toLowerCase().includes('.jpg') || 
                   url.toLowerCase().includes('.jpeg') || 
                   url.toLowerCase().includes('.png') || 
                   url.toLowerCase().includes('.webp');

    return (
      <TouchableOpacity
        key={index}
        style={styles.attachmentItem}
        onPress={() => handleAttachmentPress(url)}
        activeOpacity={0.7}
      >
        {isImage ? (
          <View style={styles.imageAttachment}>
            {imageLoading[url] && (
              <View style={styles.imageLoading}>
                <LoadingSpinner size="small" color="#4A90E2" />
              </View>
            )}
            <Image
              source={{ uri: url }}
              style={styles.attachmentImage}
              onLoadStart={() => setImageLoading(prev => ({ ...prev, [url]: true }))}
              onLoad={() => setImageLoading(prev => ({ ...prev, [url]: false }))}
              onError={() => setImageLoading(prev => ({ ...prev, [url]: false }))}
            />
            <View style={styles.imageOverlay}>
              <Eye size={16} color="white" />
            </View>
          </View>
        ) : (
          <View style={styles.documentAttachment}>
            <FileText size={32} color="#4A90E2" />
            <Text style={styles.documentName}>Document {index + 1}</Text>
          </View>
        )}
        
        <View style={styles.attachmentActions}>
          <TouchableOpacity
            style={styles.attachmentAction}
            onPress={() => handleAttachmentPress(url)}
          >
            <Eye size={14} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachmentAction}
            onPress={() => handleDownloadAttachment(url)}
          >
            <Download size={14} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderApprovalWorkflow = () => (
    <View style={styles.workflowSection}>
      <Text style={styles.sectionTitle}>{t('leave_request.approval_workflow')}</Text>
      
      <View style={styles.workflowContainer}>
        {approvalSteps.map((step, index) => (
          <View key={step.id} style={styles.workflowStep}>
            <View style={styles.stepIndicator}>
              <View style={[
                styles.stepNumber,
                { backgroundColor: getStatusColor(step.status) }
              ]}>
                <Text style={styles.stepNumberText}>{step.step}</Text>
              </View>
              {index < approvalSteps.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  { backgroundColor: step.status === 'approved' ? '#4CAF50' : '#E0E0E0' }
                ]} />
              )}
            </View>
            
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <View style={styles.stepStatus}>
                  {getStatusIcon(step.status)}
                  <Text style={[
                    styles.stepStatusText,
                    { color: getStatusColor(step.status) }
                  ]}>
                    {t(`leave_request.${step.status}`)}
                  </Text>
                </View>
              </View>
              
              {step.approver && (
                <Text style={styles.stepApprover}>
                  {step.approver} • {step.approverRole}
                </Text>
              )}
              
              {step.timestamp && (
                <Text style={styles.stepTimestamp}>
                  {step.timestamp.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
              
              {step.comments && (
                <View style={styles.stepComments}>
                  <MessageSquare size={14} color="#666" />
                  <Text style={styles.stepCommentsText}>{step.comments}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>
                {t('leave_request.leave_request_details')}
              </Text>
              {leaveRequest && (
                <View style={styles.headerMeta}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(leaveRequest.status) }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {t(`leave_request.${leaveRequest.status}`)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner text={t('common.loading')} />
            </View>
          ) : leaveRequest ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Employee Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('leave_request.employee_information')}</Text>
                <View style={styles.employeeCard}>
                  <View style={styles.employeeHeader}>
                    <View style={styles.employeeAvatar}>
                      <User size={24} color="#4A90E2" />
                    </View>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{user?.name || 'Employee Name'}</Text>
                      <Text style={styles.employeePosition}>{user?.position || 'Position'}</Text>
                      <Text style={styles.employeeDepartment}>{user?.department || 'Department'}</Text>
                      <Text style={styles.employeeId}>ID: {user?.employeeId || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Leave Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('leave_request.leave_information')}</Text>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <View style={styles.infoIcon}>
                      <Calendar size={20} color="#4A90E2" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{t('leave_request.leave_type')}</Text>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: getLeaveTypeColor(leaveRequest.leaveType) }
                      ]}>
                        <Text style={styles.typeBadgeText}>
                          {getLeaveTypeLabel(leaveRequest.leaveType)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoIcon}>
                      <Clock size={20} color="#FF9800" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{t('leave_request.duration')}</Text>
                      <Text style={styles.infoValue}>
                        {calculateDuration()} {calculateDuration() === 1 ? t('leave_request.day') : t('leave_request.days')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dateRangeCard}>
                  <View style={styles.dateRangeHeader}>
                    <Calendar size={16} color="#666" />
                    <Text style={styles.dateRangeTitle}>{t('leave_request.leave_period')}</Text>
                  </View>
                  
                  <View style={styles.dateRangeContent}>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>{t('leave_request.start_date')}</Text>
                      <Text style={styles.dateValue}>{formatLeaveDate(leaveRequest.startDate)}</Text>
                    </View>
                    
                    <View style={styles.dateArrow}>
                      <ChevronRight size={16} color="#E0E0E0" />
                    </View>
                    
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>{t('leave_request.end_date')}</Text>
                      <Text style={styles.dateValue}>{formatLeaveDate(leaveRequest.endDate)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Reason/Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('leave_request.reason_description')}</Text>
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>{leaveRequest.description}</Text>
                </View>
              </View>

              {/* Attachments */}
              {leaveRequest.attachments.length > 0 && (
                <View style={styles.section}>
                  <AttachmentPreview
                    attachments={leaveRequest.attachments}
                    title={t('leave_request.attachments')}
                    maxPreviewImages={6}
                    showDownloadButton={true}
                    onDownload={(url, index) => {
                      Alert.alert(
                        t('common.download'),
                        'Download functionality would be implemented here.',
                        [{ text: t('common.ok') }]
                      );
                    }}
                  />
                </View>
              )}

              {/* Approval Workflow */}
              {renderApprovalWorkflow()}

              {/* Submission Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('leave_request.submission_details')}</Text>
                
                <View style={styles.submissionCard}>
                  <View style={styles.submissionItem}>
                    <Text style={styles.submissionLabel}>{t('leave_request.submitted_on')}</Text>
                    <Text style={styles.submissionValue}>
                      {formatSubmissionDate(leaveRequest.submittedAt)}
                    </Text>
                  </View>
                  
                  {leaveRequest.reviewedAt && (
                    <View style={styles.submissionItem}>
                      <Text style={styles.submissionLabel}>{t('leave_request.reviewed_on')}</Text>
                      <Text style={styles.submissionValue}>
                        {formatSubmissionDate(leaveRequest.reviewedAt)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              {leaveRequest.status === 'pending' && (
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      Alert.alert('Edit Request', 'Edit functionality would be implemented here.');
                    }}
                  >
                    <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Alert.alert(
                        'Cancel Request',
                        'Are you sure you want to cancel this leave request?',
                        [
                          { text: 'No', style: 'cancel' },
                          { text: 'Yes', style: 'destructive' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <FileText size={48} color="#E0E0E0" />
              <Text style={styles.errorTitle}>{t('leave_request.request_not_found')}</Text>
              <Text style={styles.errorMessage}>{t('leave_request.request_not_available')}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  employeeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  dateRangeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  dateRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  dateRangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  dateArrow: {
    marginHorizontal: 16,
  },
  descriptionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  descriptionText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  attachmentsScrollView: {
    marginHorizontal: -20,
  },
  workflowSection: {
    marginBottom: 24,
  },
  workflowContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  workflowStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  stepConnector: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  stepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  stepApprover: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stepTimestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  stepComments: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  stepCommentsText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  submissionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  submissionItem: {
    marginBottom: 12,
  },
  submissionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submissionValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  attachmentItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageAttachment: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  documentAttachment: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  attachmentActions: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  attachmentAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
});

function setShowAttachmentModal(arg0: boolean) {
  throw new Error('Function not implemented.');
}
