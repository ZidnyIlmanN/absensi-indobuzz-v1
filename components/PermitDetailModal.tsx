import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  X,
  Clock,
  FileText,
  DollarSign,
  CheckCircle,
  Users,
  AlertTriangle,
  ChevronRight,
  Play,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

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

interface PermitDetailModalProps {
  visible: boolean;
  onClose: () => void;
  permitType: PermitType | null;
  onApply: (permitType: PermitType) => void;
}

export function PermitDetailModal({
  visible,
  onClose,
  permitType,
  onApply,
}: PermitDetailModalProps) {
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(height));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    if (visible) {
      // Animate modal in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!permitType) return null;

  const sections = [
    { id: 'overview', title: t('leave_request.overview'), icon: <Info size={16} color="#4A90E2" /> },
    { id: 'requirements', title: t('leave_request.requirements'), icon: <CheckCircle size={16} color="#4CAF50" /> },
    { id: 'documents', title: t('leave_request.documents'), icon: <FileText size={16} color="#FF9800" /> },
    { id: 'process', title: t('leave_request.process'), icon: <Play size={16} color="#9C27B0" /> },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <View style={styles.sectionContent}>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: permitType.color }]}>
                {permitType.icon}
              </View>
              <Text style={styles.overviewTitle}>{permitType.title}</Text>
              <Text style={styles.overviewDescription}>{permitType.description}</Text>
            </View>

            <View style={styles.quickInfoGrid}>
              <View style={styles.quickInfoCard}>
                <Clock size={20} color="#4A90E2" />
                <Text style={styles.quickInfoLabel}>{t('leave_request.processing_time')}</Text>
                <Text style={styles.quickInfoValue}>{permitType.processingTime}</Text>
              </View>
              
              <View style={styles.quickInfoCard}>
                <DollarSign size={20} color="#4CAF50" />
                <Text style={styles.quickInfoLabel}>{t('leave_request.fees')}</Text>
                <Text style={styles.quickInfoValue}>{permitType.fees}</Text>
              </View>
            </View>

            <View style={styles.eligibilitySection}>
              <Text style={styles.subsectionTitle}>{t('leave_request.eligibility')}</Text>
              {permitType.eligibility.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <CheckCircle size={16} color="#4CAF50" />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'requirements':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.subsectionTitle}>{t('leave_request.requirements_details')}</Text>
            {permitType.requirements.map((requirement, index) => (
              <View key={index} style={styles.requirementItem}>
                <View style={styles.requirementNumber}>
                  <Text style={styles.requirementNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
            
            {permitType.notes && permitType.notes.length > 0 && (
              <View style={styles.notesSection}>
                <Text style={styles.subsectionTitle}>{t('leave_request.important_notes')}</Text>
                {permitType.notes.map((note, index) => (
                  <View key={index} style={styles.noteItem}>
                    <AlertTriangle size={14} color="#FF9800" />
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'documents':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.subsectionTitle}>{t('leave_request.required_documents')}</Text>
            {permitType.requiredDocuments.map((document, index) => (
              <View key={index} style={styles.documentItem}>
                <FileText size={16} color="#4A90E2" />
                <Text style={styles.documentText}>{document}</Text>
              </View>
            ))}
            
            <View style={styles.documentTips}>
              <Text style={styles.tipsTitle}>{t('leave_request.document_tips')}</Text>
              <Text style={styles.tipsText}>
                • {t('leave_request.ensure_documents_clear')}{'\n'}
                • {t('leave_request.scan_or_photo_acceptable')}{'\n'}
                • {t('leave_request.file_size_limit')}{'\n'}
                • {t('leave_request.supported_formats')}
              </Text>
            </View>
          </View>
        );

      case 'process':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.subsectionTitle}>{t('leave_request.application_process')}</Text>
            {permitType.applicationSteps.map((step, index) => (
              <View key={index} style={styles.processStep}>
                <View style={styles.stepIndicator}>
                  <View style={[styles.stepNumber, { backgroundColor: permitType.color }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  {index < permitType.applicationSteps.length - 1 && (
                    <View style={styles.stepConnector} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[permitType.color, `${permitType.color}CC`]}
            style={styles.modalHeader}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.headerInfo}>
                <Text style={styles.modalTitle}>{permitType.title}</Text>
                <Text style={styles.modalSubtitle}>{t('leave_request.detailed_information')}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => onApply(permitType)}
              >
                <Text style={styles.applyButtonText}>{t('leave_request.apply_now')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Section Navigation */}
          <View style={styles.sectionNavigation}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionTabs}
            >
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.sectionTab,
                    activeSection === section.id && styles.activeSectionTab,
                    activeSection === section.id && { backgroundColor: permitType.color }
                  ]}
                  onPress={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  <Text style={[
                    styles.sectionTabText,
                    activeSection === section.id && styles.activeSectionTabText
                  ]}>
                    {section.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBodyContent}
          >
            {renderSectionContent()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: permitType.color }]}
              onPress={() => onApply(permitType)}
            >
              <Play size={16} color="white" />
              <Text style={styles.primaryButtonText}>{t('leave_request.start_application')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  applyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  sectionNavigation: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTabs: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeSectionTab: {
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  activeSectionTabText: {
    color: 'white',
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
  },
  sectionContent: {
    gap: 20,
  },
  overviewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  overviewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  overviewDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  eligibilitySection: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItemText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  requirementNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requirementNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  requirementText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 20,
  },
  notesSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginTop: 16,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  documentText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  documentTips: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  processStep: {
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
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  stepText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
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
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});