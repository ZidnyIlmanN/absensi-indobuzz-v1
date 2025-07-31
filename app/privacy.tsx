import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Globe,
  Users,
  Database,
  Activity,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  dataSharing: boolean;
  activityTracking: boolean;
  locationSharing: boolean;
  analyticsOptIn: boolean;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  timestamp: Date;
  current: boolean;
}

interface ConnectedApp {
  id: string;
  name: string;
  permissions: string[];
  lastAccess: Date;
  icon: string;
}

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'security' | 'privacy' | 'sessions' | 'apps'>('security');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  const [securityQuestions, setSecurityQuestions] = useState([
    { question: 'What was your first pet\'s name?', answer: '' },
    { question: 'What city were you born in?', answer: '' },
    { question: 'What was your mother\'s maiden name?', answer: '' },
  ]);

  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    profileVisibility: 'private',
    dataSharing: false,
    activityTracking: true,
    locationSharing: true,
    analyticsOptIn: false,
  });

  const [loginSessions] = useState<LoginSession[]>([
    {
      id: '1',
      device: 'iPhone 14 Pro',
      location: 'Jakarta, Indonesia',
      timestamp: new Date(),
      current: true,
    },
    {
      id: '2',
      device: 'Chrome on Windows',
      location: 'Jakarta, Indonesia',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      current: false,
    },
    {
      id: '3',
      device: 'Safari on MacBook',
      location: 'Bandung, Indonesia',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      current: false,
    },
  ]);

  const [connectedApps] = useState<ConnectedApp[]>([
    {
      id: '1',
      name: 'Google Calendar',
      permissions: ['Read calendar events', 'Create events'],
      lastAccess: new Date(Date.now() - 30 * 60 * 1000),
      icon: '📅',
    },
    {
      id: '2',
      name: 'Slack Integration',
      permissions: ['Send messages', 'Read user profile'],
      lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: '💬',
    },
    {
      id: '3',
      name: 'Microsoft Teams',
      permissions: ['Access profile', 'Send notifications'],
      lastAccess: new Date(Date.now() - 24 * 60 * 60 * 1000),
      icon: '👥',
    },
  ]);

  const handleSettingChange = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('One special character');
    return errors;
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(passwordForm.newPassword);
    if (passwordErrors.length > 0) {
      Alert.alert('Password Requirements', `Password must have:\n• ${passwordErrors.join('\n• ')}`);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      handleSettingChange('twoFactorEnabled', true);
      Alert.alert('Success', 'Two-factor authentication enabled');
      setShow2FAModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = () => {
    Alert.alert(
      'Disable Two-Factor Authentication',
      'This will make your account less secure. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => handleSettingChange('twoFactorEnabled', false),
        },
      ]
    );
  };

  const handleTerminateSession = (sessionId: string) => {
    Alert.alert(
      'Terminate Session',
      'Are you sure you want to terminate this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => {
            // Handle session termination
            Alert.alert('Success', 'Session terminated');
          },
        },
      ]
    );
  };

  const handleRevokeApp = (appId: string, appName: string) => {
    Alert.alert(
      'Revoke Access',
      `Remove ${appName}'s access to your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', `${appName} access revoked`);
          },
        },
      ]
    );
  };

  const SecurityTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password & Authentication</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowPasswordModal(true)}
        >
          <View style={styles.settingIcon}>
            <Lock size={20} color="#4A90E2" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Change Password</Text>
            <Text style={styles.settingSubtitle}>Update your account password</Text>
          </View>
          <ChevronRight size={16} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => settings.twoFactorEnabled ? handleDisable2FA() : setShow2FAModal(true)}
        >
          <View style={styles.settingIcon}>
            <Smartphone size={20} color="#4CAF50" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
            <Text style={styles.settingSubtitle}>
              {settings.twoFactorEnabled ? 'Enabled' : 'Add extra security to your account'}
            </Text>
          </View>
          <Switch
            value={settings.twoFactorEnabled}
            onValueChange={settings.twoFactorEnabled ? handleDisable2FA : () => setShow2FAModal(true)}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={settings.twoFactorEnabled ? '#FFFFFF' : '#F4F3F4'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowSecurityQuestions(true)}
        >
          <View style={styles.settingIcon}>
            <Key size={20} color="#FF9800" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Security Questions</Text>
            <Text style={styles.settingSubtitle}>Set up recovery questions</Text>
          </View>
          <ChevronRight size={16} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const PrivacyTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Profile Visibility */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile & Visibility</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Eye size={20} color="#9C27B0" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Profile Visibility</Text>
            <Text style={styles.settingSubtitle}>Who can see your profile</Text>
          </View>
          <TouchableOpacity style={styles.visibilitySelector}>
            <Text style={styles.visibilityText}>
              {settings.profileVisibility.charAt(0).toUpperCase() + settings.profileVisibility.slice(1)}
            </Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Database size={20} color="#2196F3" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Data Sharing</Text>
            <Text style={styles.settingSubtitle}>Share anonymous usage data</Text>
          </View>
          <Switch
            value={settings.dataSharing}
            onValueChange={(value) => handleSettingChange('dataSharing', value)}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={settings.dataSharing ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Activity size={20} color="#4CAF50" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Activity Tracking</Text>
            <Text style={styles.settingSubtitle}>Track app usage for insights</Text>
          </View>
          <Switch
            value={settings.activityTracking}
            onValueChange={(value) => handleSettingChange('activityTracking', value)}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={settings.activityTracking ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Globe size={20} color="#FF5722" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Location Sharing</Text>
            <Text style={styles.settingSubtitle}>Share location for attendance</Text>
          </View>
          <Switch
            value={settings.locationSharing}
            onValueChange={(value) => handleSettingChange('locationSharing', value)}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={settings.locationSharing ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Database size={20} color="#607D8B" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Analytics</Text>
            <Text style={styles.settingSubtitle}>Help improve the app</Text>
          </View>
          <Switch
            value={settings.analyticsOptIn}
            onValueChange={(value) => handleSettingChange('analyticsOptIn', value)}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={settings.analyticsOptIn ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
      </View>
    </ScrollView>
  );

  const SessionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        <Text style={styles.sectionSubtitle}>
          Manage devices that are currently signed in to your account
        </Text>
        
        {loginSessions.map((session) => (
          <View key={session.id} style={styles.sessionItem}>
            <View style={styles.sessionIcon}>
              <Smartphone size={20} color={session.current ? '#4CAF50' : '#666'} />
            </View>
            <View style={styles.sessionContent}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDevice}>{session.device}</Text>
                {session.current && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sessionLocation}>{session.location}</Text>
              <Text style={styles.sessionTime}>
                {session.current ? 'Active now' : `Last active ${session.timestamp.toLocaleDateString()}`}
              </Text>
            </View>
            {!session.current && (
              <TouchableOpacity
                style={styles.terminateButton}
                onPress={() => handleTerminateSession(session.id)}
              >
                <X size={16} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const AppsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Apps</Text>
        <Text style={styles.sectionSubtitle}>
          Apps and services that have access to your account
        </Text>
        
        {connectedApps.map((app) => (
          <View key={app.id} style={styles.appItem}>
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>{app.icon}</Text>
            </View>
            <View style={styles.appContent}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appPermissions}>
                {app.permissions.join(', ')}
              </Text>
              <Text style={styles.appLastAccess}>
                Last access: {app.lastAccess.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.revokeButton}
              onPress={() => handleRevokeApp(app.id, app.name)}
            >
              <Trash2 size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        ))}
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
          <Text style={styles.headerTitle}>Privacy & Security</Text>
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
              { key: 'security', label: 'Security', icon: <Shield size={16} color={activeTab === 'security' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
              { key: 'privacy', label: 'Privacy', icon: <Eye size={16} color={activeTab === 'privacy' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
              { key: 'sessions', label: 'Sessions', icon: <Smartphone size={16} color={activeTab === 'sessions' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
              { key: 'apps', label: 'Apps', icon: <Globe size={16} color={activeTab === 'apps' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} /> },
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
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'apps' && <AppsTab />}
      </View>

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Current Password */}
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Enter current password"
                  secureTextEntry={!passwordForm.showCurrent}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setPasswordForm(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                >
                  {passwordForm.showCurrent ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter new password"
                  secureTextEntry={!passwordForm.showNew}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                >
                  {passwordForm.showNew ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Requirements */}
              {passwordForm.newPassword && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  {validatePassword(passwordForm.newPassword).map((req, index) => (
                    <Text key={index} style={styles.requirementItem}>• {req}</Text>
                  ))}
                </View>
              )}

              {/* Confirm Password */}
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm new password"
                  secureTextEntry={!passwordForm.showConfirm}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setPasswordForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                >
                  {passwordForm.showConfirm ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handlePasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={show2FAModal}
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enable Two-Factor Authentication</Text>
              <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.twoFactorInfo}>
                <Shield size={48} color="#4CAF50" />
                <Text style={styles.twoFactorTitle}>Secure Your Account</Text>
                <Text style={styles.twoFactorText}>
                  Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your phone.
                </Text>
                
                <View style={styles.twoFactorSteps}>
                  <Text style={styles.stepsTitle}>How it works:</Text>
                  <Text style={styles.stepItem}>1. Download an authenticator app</Text>
                  <Text style={styles.stepItem}>2. Scan the QR code we'll provide</Text>
                  <Text style={styles.stepItem}>3. Enter the verification code</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShow2FAModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEnable2FA}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Enable 2FA</Text>
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
  section: {
    marginTop: 20,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  visibilitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginRight: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  sessionLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: '#999',
  },
  terminateButton: {
    padding: 8,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 20,
  },
  appContent: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  appPermissions: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  appLastAccess: {
    fontSize: 12,
    color: '#999',
  },
  revokeButton: {
    padding: 8,
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  passwordRequirements: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
  },
  requirementItem: {
    fontSize: 12,
    color: '#F57C00',
    marginBottom: 2,
  },
  twoFactorInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  twoFactorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 12,
  },
  twoFactorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  twoFactorSteps: {
    alignSelf: 'stretch',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stepItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});