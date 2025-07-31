import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Book,
  Users,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
  FileText,
  Video,
  Headphones,
  X,
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface ContactForm {
  category: string;
  subject: string;
  message: string;
  email: string;
  priority: 'low' | 'medium' | 'high';
}

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'resources' | 'feedback'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState<ContactForm>({
    category: 'general',
    subject: '',
    message: '',
    email: '',
    priority: 'medium',
  });

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I clock in/out?',
      answer: 'To clock in or out, tap the Clock In/Out button on the home screen. You\'ll need to take a selfie and be within the office location range for verification.',
      category: 'attendance',
      helpful: 45,
    },
    {
      id: '2',
      question: 'Why is my location not being detected?',
      answer: 'Make sure GPS is enabled on your device and you\'re within 100 meters of the office. Try refreshing your location or restarting the app if issues persist.',
      category: 'technical',
      helpful: 32,
    },
    {
      id: '3',
      question: 'How do I request time off?',
      answer: 'Go to the Request tab, select "Time Off", fill in the details including dates and reason, then submit. Your manager will review and approve/reject the request.',
      category: 'requests',
      helpful: 28,
    },
    {
      id: '4',
      question: 'Can I edit my profile information?',
      answer: 'Yes, go to Profile > Edit Profile to update your personal information, contact details, and profile picture.',
      category: 'profile',
      helpful: 21,
    },
    {
      id: '5',
      question: 'How do I submit a reimbursement request?',
      answer: 'Navigate to the Reimburse section, select the expense category, enter the amount and description, attach a receipt photo, and submit for approval.',
      category: 'requests',
      helpful: 19,
    },
    {
      id: '6',
      question: 'What should I do if I forgot to clock out?',
      answer: 'Contact your manager or HR department immediately. They can manually adjust your attendance record for that day.',
      category: 'attendance',
      helpful: 15,
    },
  ];

  const categories = [
    { id: 'all', name: 'All', count: faqData.length },
    { id: 'attendance', name: 'Attendance', count: faqData.filter(f => f.category === 'attendance').length },
    { id: 'requests', name: 'Requests', count: faqData.filter(f => f.category === 'requests').length },
    { id: 'technical', name: 'Technical', count: faqData.filter(f => f.category === 'technical').length },
    { id: 'profile', name: 'Profile', count: faqData.filter(f => f.category === 'profile').length },
  ];

  const contactCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'attendance', label: 'Attendance Issue' },
    { value: 'account', label: 'Account Problem' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
  ];

  const resources = [
    {
      id: '1',
      title: 'Getting Started Guide',
      description: 'Complete guide for new users',
      type: 'guide',
      icon: <Book size={20} color="#4A90E2" />,
      url: 'https://help.company.com/getting-started',
    },
    {
      id: '2',
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      type: 'video',
      icon: <Video size={20} color="#FF9800" />,
      url: 'https://help.company.com/videos',
    },
    {
      id: '3',
      title: 'User Manual',
      description: 'Comprehensive user documentation',
      type: 'document',
      icon: <FileText size={20} color="#4CAF50" />,
      url: 'https://help.company.com/manual',
    },
    {
      id: '4',
      title: 'Community Forum',
      description: 'Connect with other users',
      type: 'community',
      icon: <Users size={20} color="#9C27B0" />,
      url: 'https://community.company.com',
    },
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleFAQToggle = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim() || !contactForm.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(
        'Success',
        'Your message has been sent successfully. We\'ll get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => setShowContactModal(false) }]
      );
      setContactForm({
        category: 'general',
        subject: '',
        message: '',
        email: '',
        priority: 'medium',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResourceOpen = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+6281234567890');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@company.com');
  };

  const FAQTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search frequently asked questions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={handleCallSupport}>
          <Phone size={20} color="#4CAF50" />
          <Text style={styles.quickActionText}>Call Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={handleEmailSupport}>
          <Mail size={20} color="#2196F3" />
          <Text style={styles.quickActionText}>Email Us</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={() => setShowContactModal(true)}>
          <MessageCircle size={20} color="#FF9800" />
          <Text style={styles.quickActionText}>Live Chat</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {filteredFAQs.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color="#E0E0E0" />
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search terms or browse all questions
            </Text>
          </View>
        ) : (
          filteredFAQs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => handleFAQToggle(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFAQ === faq.id ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </View>
              
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  <View style={styles.faqFooter}>
                    <View style={styles.faqHelpful}>
                      <Star size={14} color="#FF9800" />
                      <Text style={styles.faqHelpfulText}>
                        {faq.helpful} people found this helpful
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  const ContactTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        
        <TouchableOpacity style={styles.contactOption} onPress={handleCallSupport}>
          <View style={styles.contactIcon}>
            <Phone size={24} color="#4CAF50" />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Phone Support</Text>
            <Text style={styles.contactSubtitle}>+62 812-3456-7890</Text>
            <Text style={styles.contactHours}>Mon-Fri, 9AM-6PM WIB</Text>
          </View>
          <ChevronRight size={16} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactOption} onPress={handleEmailSupport}>
          <View style={styles.contactIcon}>
            <Mail size={24} color="#2196F3" />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactSubtitle}>support@company.com</Text>
            <Text style={styles.contactHours}>Response within 24 hours</Text>
          </View>
          <ChevronRight size={16} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactOption} onPress={() => setShowContactModal(true)}>
          <View style={styles.contactIcon}>
            <MessageCircle size={24} color="#FF9800" />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactSubtitle}>Chat with our support team</Text>
            <Text style={styles.contactHours}>Available 24/7</Text>
          </View>
          <ChevronRight size={16} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Office Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support Hours</Text>
        <View style={styles.hoursCard}>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Monday - Friday</Text>
            <Text style={styles.hoursTime}>9:00 AM - 6:00 PM WIB</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Saturday</Text>
            <Text style={styles.hoursTime}>10:00 AM - 4:00 PM WIB</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Sunday</Text>
            <Text style={styles.hoursTime}>Closed</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const ResourcesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help Resources</Text>
        
        {resources.map((resource) => (
          <TouchableOpacity
            key={resource.id}
            style={styles.resourceItem}
            onPress={() => handleResourceOpen(resource.url)}
            activeOpacity={0.7}
          >
            <View style={styles.resourceIcon}>
              {resource.icon}
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
            </View>
            <ExternalLink size={16} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusTitle}>All Systems Operational</Text>
          </View>
          <Text style={styles.statusText}>
            All services are running normally. Last updated: {new Date().toLocaleString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const FeedbackTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Feedback</Text>
        <Text style={styles.sectionSubtitle}>
          Help us improve by sharing your thoughts and suggestions
        </Text>
        
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setShowContactModal(true)}
        >
          <MessageCircle size={20} color="white" />
          <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.appInfoCard}>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>Build</Text>
            <Text style={styles.appInfoValue}>2024.02.10</Text>
          </View>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>Platform</Text>
            <Text style={styles.appInfoValue}>React Native</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
        >
          <View style={styles.tabContainer}>
            {[
              { key: 'faq', label: 'FAQ', icon: <Book size={16} color={activeTab === 'faq' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
              { key: 'contact', label: 'Contact', icon: <Phone size={16} color={activeTab === 'contact' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
              { key: 'resources', label: 'Resources', icon: <FileText size={16} color={activeTab === 'resources' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
              { key: 'feedback', label: 'Feedback', icon: <Star size={16} color={activeTab === 'feedback' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                {tab.icon}
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'faq' && <FAQTab />}
        {activeTab === 'contact' && <ContactTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
      </View>

      {/* Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showContactModal}
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryContainer}>
                {contactCategories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryOption,
                      contactForm.category === category.value && styles.categoryOptionSelected
                    ]}
                    onPress={() => setContactForm(prev => ({ ...prev, category: category.value }))}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      contactForm.category === category.value && styles.categoryOptionTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Email */}
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={contactForm.email}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />

              {/* Subject */}
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                value={contactForm.subject}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
                placeholder="Brief description of your issue"
                placeholderTextColor="#999"
              />

              {/* Message */}
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={contactForm.message}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
                placeholder="Describe your issue in detail..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              {/* Priority */}
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      contactForm.priority === priority && styles.priorityOptionSelected
                    ]}
                    onPress={() => setContactForm(prev => ({ ...prev, priority: priority as any }))}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      contactForm.priority === priority && styles.priorityOptionTextSelected
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleContactSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  </>
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
    marginBottom: 20,
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
  placeholder: {
    width: 40,
  },
  tabScrollView: {
    marginHorizontal: -20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#1A1A1A',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  faqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqHelpful: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqHelpfulText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  contactHours: {
    fontSize: 12,
    color: '#666',
  },
  hoursCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  hoursDay: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 14,
    color: '#666',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    color: '#666',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  appInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  appInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  categoryOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityOptionTextSelected: {
    color: 'white',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});