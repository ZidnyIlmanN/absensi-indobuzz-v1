import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { X, Heart, Clock, User, Building, FileText, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, MessageSquare } from 'lucide-react-native';
import { SickLeaveRequest } from '@/services/sickLeave';
import { LoadingSpinner } from './LoadingSpinner';
import { useI18n } from '@/hooks/useI18n';
import { useAppContext } from '@/context/AppContext';
import { AttachmentPreview } from './AttachmentPreview';

interface SickLeaveDetailModalProps {
  visible: boolean;
  onClose: () => void;
  sickLeaveRequest: SickLeaveRequest | null;
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

export function SickLeaveDetailModal({
  visible,
  onClose,
  sickLeaveRequest,
  isLoading = false,
}: SickLeaveDetailModalProps) {
  const { t, formatLeaveDate, formatLeaveDateShort, formatSubmissionDate } = useI18n();
  const { user } = useAppContext();

  if (!sickLeaveRequest && !isLoading) return null;

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

  // Mock approval workflow
  const getApprovalWorkflow = (): ApprovalStep[] => {
    if (!sickLeaveRequest) return [];

    const steps: ApprovalStep[] = [
      {
        id: '1',
        step: 1,
        title: 'HR Department',
        status: sickLeaveRequest.status === 'rejected' ? 'rejected' : 
                sickLeaveRequest.status === 'approved' ? 'approved' : 'pending',
        approver: 'HR Manager',
        approverRole: undefined,
        timestamp: sickLeaveRequest.reviewedAt,
        comments: sickLeaveRequest.reviewNotes,
      },
    ];

    return steps;
  };

  const approvalSteps = getApprovalWorkflow();

  const renderApprovalWorkflow = () => (
    <View style={styles.workflowSection}>
      <Text style={styles.sectionTitle}>{t('sick_leave.approval_workflow')}</Text>
      
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
                    {t(`sick_leave.${step.status}`)}
                  </Text>
                </View>
              </View>
              
              {step.approver && (
                <Text style={styles.stepApprover}>
                  {step.approver}
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
                {t('sick_leave.sick_leave_details')}
              </Text>
              {sickLeaveRequest && (
                <View style={styles.headerMeta}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(sickLeaveRequest.status) }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {t(`sick_leave.${sickLeaveRequest.status}`)}
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
          ) : sickLeaveRequest ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Employee Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sick_leave.employee_information')}</Text>
                <View style={styles.employeeCard}>
                  <View style={styles.employeeHeader}>
                    <View style={styles.employeeAvatar}>
                      <User size={24} color="#F44336" />
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

              {/* Sick Leave Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sick_leave.sick_leave_information')}</Text>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <View style={styles.infoIcon}>
                      <Heart size={20} color="#F44336" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{t('sick_leave.sick_date')}</Text>
                      <Text style={styles.infoValue}>
                        {formatLeaveDate(sickLeaveRequest.selectedDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoIcon}>
                      <Clock size={20} color="#FF9800" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{t('sick_leave.duration')}</Text>
                      <Text style={styles.infoValue}>
                        {t('sick_leave.single_day')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Reason/Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sick_leave.reason_description')}</Text>
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>{sickLeaveRequest.reason}</Text>
                </View>
              </View>

              {/* Attachments */}
              {sickLeaveRequest.attachments.length > 0 && (
                <View style={styles.section}>
                  <AttachmentPreview
                    attachments={sickLeaveRequest.attachments}
                    title={t('sick_leave.attachments')}
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
                <Text style={styles.sectionTitle}>{t('sick_leave.submission_details')}</Text>
                
                <View style={styles.submissionCard}>
                  <View style={styles.submissionItem}>
                    <Text style={styles.submissionLabel}>{t('sick_leave.submitted_on')}</Text>
                    <Text style={styles.submissionValue}>
                      {formatSubmissionDate(sickLeaveRequest.submittedAt)}
                    </Text>
                  </View>
                  
                  {sickLeaveRequest.reviewedAt && (
                    <View style={styles.submissionItem}>
                      <Text style={styles.submissionLabel}>{t('sick_leave.reviewed_on')}</Text>
                      <Text style={styles.submissionValue}>
                        {formatSubmissionDate(sickLeaveRequest.reviewedAt)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              {sickLeaveRequest.status === 'pending' && (
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
                        'Are you sure you want to cancel this sick leave request?',
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
              <Heart size={48} color="#E0E0E0" />
              <Text style={styles.errorTitle}>{t('sick_leave.request_not_found')}</Text>
              <Text style={styles.errorMessage}>{t('sick_leave.request_not_available')}</Text>
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
    marginTop: 8,
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
    backgroundColor: '#FFEBEE',
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
    color: '#F44336',
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
  descriptionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
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
    borderLeftColor: '#F44336',
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
    backgroundColor: '#F44336',
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
});
