import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock, Users, MessageSquare, Filter } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';

interface Notification {
  id: string;
  type: 'announcement' | 'reminder' | 'approval' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'announcement',
    title: 'Company Outing 2024',
    message: 'Annual company outing to Bandung on March 15-16. Register now!',
    timestamp: '2024-02-10 09:30',
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Clock In Reminder',
    message: "Don't forget to clock in today. Your shift starts at 09:00 AM.",
    timestamp: '2024-02-10 08:45',
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'approval',
    title: 'Leave Request Approved',
    message: 'Your annual leave request for Feb 15-20 has been approved.',
    timestamp: '2024-02-09 14:20',
    read: true,
    priority: 'medium',
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'The system will undergo maintenance tonight from 11 PM to 2 AM.',
    timestamp: '2024-02-09 10:15',
    read: true,
    priority: 'low',
  },
  {
    id: '5',
    type: 'announcement',
    title: 'New Policy Update',
    message: 'Updated remote work policy effective immediately. Please review.',
    timestamp: '2024-02-08 16:30',
    read: false,
    priority: 'high',
  },
];

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread' | 'announcements'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Users size={20} color="#4A90E2" />;
      case 'reminder':
        return <Clock size={20} color="#FF9800" />;
      case 'approval':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'system':
        return <AlertCircle size={20} color="#9E9E9E" />;
      default:
        return <Bell size={20} color="#666" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return '#E3F2FD';
      case 'reminder':
        return '#FFF3E0';
      case 'approval':
        return '#E8F5E8';
      case 'system':
        return '#F8F9FA';
      default:
        return '#F8F9FA';
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
        return '#9E9E9E';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'announcements':
        return notification.type === 'announcement';
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
          <View>
            <Text style={styles.headerTitle}>Inbox</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread notifications
            </Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, filter === 'announcements' && styles.filterTabActive]}
            onPress={() => setFilter('announcements')}
          >
            <Text style={[styles.filterTabText, filter === 'announcements' && styles.filterTabTextActive]}>
              Announcements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={48} color="#E0E0E0" />}
              title="No notifications"
              message={
                filter === 'unread' 
                  ? "You're all caught up!" 
                  : "No notifications to show"
              }
            />
          ) : (
            filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.notificationHeader}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: getNotificationColor(notification.type) }
                ]}>
                  {getNotificationIcon(notification.type)}
                </View>
                
                <View style={styles.notificationInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </Text>
                    <View style={styles.metaInfo}>
                      <View style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(notification.priority) }
                      ]} />
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                  
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  
                  <Text style={styles.notificationTimestamp}>
                    {new Date(notification.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#4A90E2',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  notificationCard: {
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  titleRow: {
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
  metaInfo: {
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
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
});