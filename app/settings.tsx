import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Globe, Clock, Palette, Type, Mail, Download, Upload, Trash2, ChevronRight, Moon, Sun, Languages, Bell, Database, TriangleAlert as AlertTriangle, Check } from 'lucide-react-native';

interface AppSettings {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  autoBackup: boolean;
  dataSharing: boolean;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings>({
    language: 'English',
    timezone: 'Asia/Jakarta',
    theme: 'system',
    fontSize: 'medium',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    autoBackup: true,
    dataSharing: false,
  });

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
  ];

  const timezones = [
    { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  ];

  const themes = [
    { value: 'light', label: 'Light', icon: <Sun size={20} color="#666" /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={20} color="#666" /> },
    { value: 'system', label: 'System', icon: <Palette size={20} color="#666" /> },
  ];

  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert('Success', 'Data exported successfully!');
            }, 2000);
          },
        },
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Select a JSON file to import your data. This will overwrite existing data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: () => {
            Alert.alert('Info', 'File picker functionality would be implemented here.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    Alert.alert(
      'Account Deleted',
      'Your account has been scheduled for deletion. You have 30 days to recover it.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {rightComponent || (showArrow && <ChevronRight size={16} color="#C7C7CC" />)}
    </TouchableOpacity>
  );

  const SelectionModal = ({ 
    visible, 
    onClose, 
    title, 
    options, 
    selectedValue, 
    onSelect 
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
    selectedValue: string;
    onSelect: (value: string) => void;
  }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                {option.icon && <View style={styles.modalOptionIcon}>{option.icon}</View>}
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {selectedValue === option.value && (
                  <Check size={20} color="#4A90E2" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Preferences</Text>
          
          <SettingItem
            icon={<Languages size={20} color="#4A90E2" />}
            title="Language"
            subtitle="Choose your preferred language"
            value={settings.language}
            onPress={() => setShowLanguageModal(true)}
          />
          
          <SettingItem
            icon={<Clock size={20} color="#4CAF50" />}
            title="Timezone"
            subtitle="Set your local timezone"
            value={settings.timezone}
            onPress={() => setShowTimezoneModal(true)}
          />
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Settings</Text>
          
          <SettingItem
            icon={<Palette size={20} color="#9C27B0" />}
            title="Theme"
            subtitle="Choose your preferred theme"
            value={settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
            onPress={() => setShowThemeModal(true)}
          />
          
          <SettingItem
            icon={<Type size={20} color="#FF9800" />}
            title="Font Size"
            subtitle="Adjust text size for better readability"
            value={settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
            onPress={() => setShowFontModal(true)}
          />
        </View>

        {/* Email Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Preferences</Text>
          
          <SettingItem
            icon={<Mail size={20} color="#2196F3" />}
            title="Email Notifications"
            subtitle="Receive important updates via email"
            rightComponent={
              <Switch
                value={settings.emailNotifications}
                onValueChange={(value) => handleSettingChange('emailNotifications', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={settings.emailNotifications ? '#FFFFFF' : '#F4F3F4'}
              />
            }
            showArrow={false}
          />
          
          <SettingItem
            icon={<Bell size={20} color="#FF5722" />}
            title="Push Notifications"
            subtitle="Get notified about important events"
            rightComponent={
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => handleSettingChange('pushNotifications', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={settings.pushNotifications ? '#FFFFFF' : '#F4F3F4'}
              />
            }
            showArrow={false}
          />
          
          <SettingItem
            icon={<Mail size={20} color="#607D8B" />}
            title="Marketing Emails"
            subtitle="Receive promotional content and offers"
            rightComponent={
              <Switch
                value={settings.marketingEmails}
                onValueChange={(value) => handleSettingChange('marketingEmails', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={settings.marketingEmails ? '#FFFFFF' : '#F4F3F4'}
              />
            }
            showArrow={false}
          />
          
          <SettingItem
            icon={<Mail size={20} color="#795548" />}
            title="Weekly Digest"
            subtitle="Get a summary of your weekly activity"
            rightComponent={
              <Switch
                value={settings.weeklyDigest}
                onValueChange={(value) => handleSettingChange('weeklyDigest', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={settings.weeklyDigest ? '#FFFFFF' : '#F4F3F4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <SettingItem
            icon={<Database size={20} color="#4CAF50" />}
            title="Auto Backup"
            subtitle="Automatically backup your data"
            rightComponent={
              <Switch
                value={settings.autoBackup}
                onValueChange={(value) => handleSettingChange('autoBackup', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={settings.autoBackup ? '#FFFFFF' : '#F4F3F4'}
              />
            }
            showArrow={false}
          />
          
          <SettingItem
            icon={<Download size={20} color="#2196F3" />}
            title="Export Data"
            subtitle="Download your data as JSON file"
            onPress={handleExportData}
          />
          
          <SettingItem
            icon={<Upload size={20} color="#FF9800" />}
            title="Import Data"
            subtitle="Import data from backup file"
            onPress={handleImportData}
          />
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <SettingItem
            icon={<Database size={20} color="#9C27B0" />}
            title="Data Sharing"
            subtitle="Share anonymous usage data to improve the app"
            rightComponent={
              <Switch
                value={settings.dataSharing}
                onValueChange={(value) => handleSettingChange('dataSharing', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={settings.dataSharing ? '#FFFFFF' : '#F4F3F4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <SettingItem
            icon={<Trash2 size={20} color="#F44336" />}
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
          />
        </View>
      </ScrollView>

      {/* Selection Modals */}
      <SelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Select Language"
        options={languages.map(lang => ({ value: lang.name, label: lang.name }))}
        selectedValue={settings.language}
        onSelect={(value) => handleSettingChange('language', value)}
      />

      <SelectionModal
        visible={showTimezoneModal}
        onClose={() => setShowTimezoneModal(false)}
        title="Select Timezone"
        options={timezones.map(tz => ({ value: tz.value, label: tz.label }))}
        selectedValue={settings.timezone}
        onSelect={(value) => handleSettingChange('timezone', value)}
      />

      <SelectionModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Select Theme"
        options={themes.map(theme => ({ 
          value: theme.value, 
          label: theme.label, 
          icon: theme.icon 
        }))}
        selectedValue={settings.theme}
        onSelect={(value) => handleSettingChange('theme', value as any)}
      />

      <SelectionModal
        visible={showFontModal}
        onClose={() => setShowFontModal(false)}
        title="Select Font Size"
        options={fontSizes.map(size => ({ value: size.value, label: size.label }))}
        selectedValue={settings.fontSize}
        onSelect={(value) => handleSettingChange('fontSize', value as any)}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <AlertTriangle size={48} color="#F44336" />
              <Text style={styles.deleteModalTitle}>Delete Account</Text>
            </View>
            
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            
            <Text style={styles.deleteModalWarning}>
              All your data, including attendance records, requests, and personal information will be permanently deleted.
            </Text>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirm}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.deleteModalConfirmText}>Delete Account</Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
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
    maxHeight: '70%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalClose: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});