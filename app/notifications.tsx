import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Mail, MessageSquare, Phone, Settings, Trash2, CircleCheck as CheckCircle, Circle, Clock, Users, Calendar, CircleAlert as AlertCircle, Filter, MoveVertical as MoreVertical } from 'lucide-react-native';

interface NotificationItem {
  id: string;
  type: 'email' | 'push' | 'sms' | 'system';
  category: 'attendance' | 'request' | 'announcement' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationPreferences {
  email: {
    attendance: boolean;
    requests: boolean;
    announcements: boolean;
    reminders: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  push: {
    attendance: boolean;
    requests: boolean;
    announcements: boolean;
    reminders: boolean;
    enabled: boolean;
  };
  sms: {
    attendance: boolean;
    requests: boolean;
    announcements: boolean;
    reminders: boolean;
    enabled: boolean;
  };
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'push',
      category: 'attendance',
      title: 'Clock In Reminder',
      message: 'Don\'t forget to clock in today. Your shift starts at 09:00 AM.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      priority: 'high',
    },
    {
      id: '2',
      type: 'email',
      category: 'request',
      title: 'Leave Request Approved',
      message: 'Your annual leave request for Feb 15-20 has been approved by your manager.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      priority: 'medium',
    },
    {
      id: '3',
      type: 'push',
      category: 'announcement',
      title: 'Company Outing 2024',
      message: 'Annual company outing to Bandung on March 15-16. Register now!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      priority: 'medium',
    },
    {
      id: '4',
      type: 'system',
      category: 'system',
      title: 'System Maintenance',
      message: 'The system will undergo maintenance tonight from 11 PM to 2 AM.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
      priority: 'low',
    },
  ]);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      attendance: true,
      requests: true,
      announcements: true,
      reminders: true,
      frequency: 'immediate',
    },
    push: {
      attendance: true,
      requests: true,
      announcements: true,
      reminders: true,
      enabled: true,
    },
    sms: {
      attendance: false,
      requests: true,
      announcements: false,
      reminders: false,
      enabled: false,
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'attendance':
        return <Clock size={20} color="#4A90E2" />;
      case 'request':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'announcement':
        return <Users size={20} color="#FF9800" />;
      case 'reminder':
        return <Bell size={20} color="#9C27B0" />;
      case 'system':
        return <Settings size={20} color="#666" />;
      default:
        return <Bell size={20} color="#666" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} color="#666" />;
      case 'push':
        return <Bell size={16} color="#666" />;
      case 'sms':
        return <MessageSquare size={16} color="#666" />;
      case 'system':
        return <Settings size={16} color="#666" />;
      default:
        return <Bell size={16} color="#666" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const toggleNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: !notif.read } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(notif => notif.id !== id));
          },
        },
      ]
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const updatePreference = (
    type: keyof NotificationPreferences,
    category: string,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [category]: value,
      },
    }));
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read;
      case 'read':
        return notif.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preferences' && styles.activeTab]}
            onPress={() => setActiveTab('preferences')}
          >
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.activeTabText]}>
              Preferences
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'notifications' ? (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Filter and Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'unread' && styles.activeFilter]}
                onPress={() => setFilter('unread')}
              >
                <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'read' && styles.activeFilter]}
                onPress={() => setFilter('read')}
              >
                <Text style={[styles.filterText, filter === 'read' && styles.activeFilterText]}>
                  Read ({notifications.length - unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={markAllAsRead}>
                <CheckCircle size={16} color="#4A90E2" />
                <Text style={styles.actionButtonText}>Mark All Read</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={clearAllNotifications}>
                <Trash2 size={16} color="#F44336" />
                <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <View style={styles.notificationsList}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color="#E0E0E0" />
                <Text style={styles.emptyStateTitle}>No notifications</Text>
                <Text style={styles.emptyStateText}>
                  {filter === 'unread' 
                    ? "You're all caught up!" 
                    : "No notifications to show"
                  }
                </Text>
              </View>
            ) : (
              filteredNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => toggleNotificationRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(notification.category)}
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTitleRow}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <View style={styles.notificationMeta}>
                          <View style={[
                            styles.priorityDot,
                            { backgroundColor: getPriorityColor(notification.priority) }
                          ]} />
                          {getTypeIcon(notification.type)}
                        </View>
                      </View>
                      
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      
                      <Text style={styles.notificationTimestamp}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </View>

                    <View style={styles.notificationActions}>
                      <TouchableOpacity
                        style={styles.readToggle}
                        onPress={() => toggleNotificationRead(notification.id)}
                      >
                        {notification.read ? (
                          <Circle size={20} color="#666" />
                        ) : (
                          <CheckCircle size={20} color="#4A90E2" />
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteNotification(notification.id)}
                      >
                        <Trash2 size={16} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          {/* Email Preferences */}
          <View style={styles.preferencesSection}>
            <View style={styles.preferenceHeader}>
              <Mail size={24} color="#4A90E2" />
              <Text style={styles.preferenceSectionTitle}>Email Notifications</Text>
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Attendance Updates</Text>
              <Switch
                value={preferences.email.attendance}
                onValueChange={(value) => updatePreference('email', 'attendance', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={preferences.email.attendance ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Request Updates</Text>
              <Switch
                value={preferences.email.requests}
                onValueChange={(value) => updatePreference('email', 'requests', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={preferences.email.requests ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Announcements</Text>
              <Switch
                value={preferences.email.announcements}
                onValueChange={(value) => updatePreference('email', 'announcements', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={preferences.email.announcements ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Reminders</Text>
              <Switch
                value={preferences.email.reminders}
                onValueChange={(value) => updatePreference('email', 'reminders', value)}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={preferences.email.reminders ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>

            <View style={styles.frequencyContainer}>
              <Text style={styles.frequencyLabel}>Email Frequency</Text>
              <View style={styles.frequencyOptions}>
                {['immediate', 'daily', 'weekly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyOption,
                      preferences.email.frequency === freq && styles.activeFrequency
                    ]}
                    onPress={() => setPreferences(prev => ({
                      ...prev,
                      email: { ...prev.email, frequency: freq as any }
                    }))}
                  >
                    <Text style={[
                      styles.frequencyOptionText,
                      preferences.email.frequency === freq && styles.activeFrequencyText
                    ]}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Push Preferences */}
          <View style={styles.preferencesSection}>
            <View style={styles.preferenceHeader}>
              <Bell size={24} color="#4CAF50" />
              <Text style={styles.preferenceSectionTitle}>Push Notifications</Text>
              <Switch
                value={preferences.push.enabled}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  push: { ...prev.push, enabled: value }
                }))}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={preferences.push.enabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            
            {preferences.push.enabled && (
              <>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Attendance Updates</Text>
                  <Switch
                    value={preferences.push.attendance}
                    onValueChange={(value) => updatePreference('push', 'attendance', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.push.attendance ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Request Updates</Text>
                  <Switch
                    value={preferences.push.requests}
                    onValueChange={(value) => updatePreference('push', 'requests', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.push.requests ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Announcements</Text>
                  <Switch
                    value={preferences.push.announcements}
                    onValueChange={(value) => updatePreference('push', 'announcements', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.push.announcements ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Reminders</Text>
                  <Switch
                    value={preferences.push.reminders}
                    onValueChange={(value) => updatePreference('push', 'reminders', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.push.reminders ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
              </>
            )}
          </View>

          {/* SMS Preferences */}
          <View style={styles.preferencesSection}>
            <View style={styles.preferenceHeader}>
              <MessageSquare size={24} color="#FF9800" />
              <Text style={styles.preferenceSectionTitle}>SMS Notifications</Text>
              <Switch
                value={preferences.sms.enabled}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  sms: { ...prev.sms, enabled: value }
                }))}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor={preferences.sms.enabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            
            {preferences.sms.enabled && (
              <>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Attendance Updates</Text>
                  <Switch
                    value={preferences.sms.attendance}
                    onValueChange={(value) => updatePreference('sms', 'attendance', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.sms.attendance ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Request Updates</Text>
                  <Switch
                    value={preferences.sms.requests}
                    onValueChange={(value) => updatePreference('sms', 'requests', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.sms.requests ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Announcements</Text>
                  <Switch
                    value={preferences.sms.announcements}
                    onValueChange={(value) => updatePreference('sms', 'announcements', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.sms.announcements ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Reminders</Text>
                  <Switch
                    value={preferences.sms.reminders}
                    onValueChange={(value) => updatePreference('sms', 'reminders', value)}
                    trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                    thumbColor={preferences.sms.reminders ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
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
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 6,
    fontWeight: '500',
  },
  notificationsList: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  notificationItem: {
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  notificationActions: {
    alignItems: 'center',
    marginLeft: 8,
  },
  readToggle: {
    padding: 4,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  preferencesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  frequencyContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  activeFrequency: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  frequencyOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFrequencyText: {
    color: 'white',
    fontWeight: '600',
  },
});