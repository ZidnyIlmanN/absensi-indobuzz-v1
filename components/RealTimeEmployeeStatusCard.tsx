import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from 'react-native';
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Wifi,
  WifiOff,
  Activity,
  Coffee,
  LogOut,
  MoreVertical,
} from 'lucide-react-native';
import { Employee } from '@/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface RealTimeEmployeeStatusCardProps {
  employee: Employee & { 
    lastActivity?: Date; 
    isConnected?: boolean;
    minutesInStatus?: number;
  };
  onPress?: () => void;
  onStatusUpdate?: (employeeId: string, newStatus: 'online' | 'break' | 'offline') => void;
  showContactInfo?: boolean;
  showNavigationArrow?: boolean;
  showStatusActions?: boolean;
  isManager?: boolean;
}

export function RealTimeEmployeeStatusCard({
  employee,
  onPress,
  onStatusUpdate,
  showContactInfo = true,
  showNavigationArrow = true,
  showStatusActions = false,
  isManager = false,
}: RealTimeEmployeeStatusCardProps) {
  const { t } = useTranslation();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showActions, setShowActions] = useState(false);

  // Animate status indicator for online employees
  useEffect(() => {
    if (employee.status === 'online') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [employee.status, pulseAnim]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/employee/${employee.id}` as any);
    }
  };

  const handleStatusAction = (newStatus: 'online' | 'break' | 'offline') => {
    if (!isManager) {
      Alert.alert('Unauthorized', 'Only managers can change employee status');
      return;
    }

    Alert.alert(
      'Change Status',
      `Change ${employee.name}'s status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            onStatusUpdate?.(employee.id, newStatus);
            setShowActions(false);
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'break':
        return '#FF9800';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return t('employee.online');
      case 'break':
        return t('employee.on_break');
      case 'offline':
        return t('employee.offline');
      default:
        return t('common.na');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Activity size={12} color="white" />;
      case 'break':
        return <Coffee size={12} color="white" />;
      case 'offline':
        return <LogOut size={12} color="white" />;
      default:
        return <Activity size={12} color="white" />;
    }
  };

  const formatLastActivity = () => {
    if (!employee.lastActivity) return '';
    
    const now = new Date();
    const diff = now.getTime() - employee.lastActivity.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return employee.lastActivity.toLocaleDateString();
  };

  const formatTimeInStatus = () => {
    if (!employee.minutesInStatus) return '';
    
    const minutes = employee.minutesInStatus;
    if (minutes < 60) return `${Math.floor(minutes)}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=50`
              }} 
              style={styles.avatar} 
            />
            
            {/* Animated Status Indicator */}
            <Animated.View
              style={[
                styles.statusIndicator,
                { 
                  backgroundColor: getStatusColor(employee.status),
                  transform: [{ scale: employee.status === 'online' ? pulseAnim : 1 }],
                }
              ]}
            >
              {getStatusIcon(employee.status)}
            </Animated.View>

            {/* Connection Indicator */}
            <View style={[
              styles.connectionIndicator,
              { backgroundColor: employee.isConnected ? '#4CAF50' : '#F44336' }
            ]}>
              {employee.isConnected ? (
                <Wifi size={8} color="white" />
              ) : (
                <WifiOff size={8} color="white" />
              )}
            </View>
          </View>
          
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employee.name}</Text>
            <Text style={styles.employeeId}>ID: {employee.employeeId}</Text>
            <Text style={styles.employeePosition}>{employee.position || 'No position'}</Text>
            <Text style={styles.employeeDepartment}>{employee.department || 'No department'}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(employee.status) }
            ]}>
              <Text style={styles.statusText}>{getStatusText(employee.status)}</Text>
            </View>
            
            {/* Real-time Status Info */}
            <View style={styles.statusInfo}>
              {employee.lastActivity && (
                <Text style={styles.lastActivityText}>
                  {formatLastActivity()}
                </Text>
              )}
              {employee.minutesInStatus && (
                <Text style={styles.timeInStatusText}>
                  {formatTimeInStatus()} in status
                </Text>
              )}
            </View>

            {/* Actions Menu */}
            {showStatusActions && isManager && (
              <TouchableOpacity
                style={styles.actionsButton}
                onPress={() => setShowActions(!showActions)}
              >
                <MoreVertical size={16} color="#666" />
              </TouchableOpacity>
            )}
            
            {showNavigationArrow && (
              <ChevronRight size={16} color="#C7C7CC" style={styles.navigationArrow} />
            )}
          </View>
        </View>
        
        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Clock size={14} color="#666" />
            <Text style={styles.detailText}>{employee.workHours || '09:00-18:00'}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={14} color="#666" />
            <Text style={styles.detailText}>{employee.location || 'No location'}</Text>
          </View>

          {/* Connection Status */}
          <View style={styles.detailItem}>
            {employee.isConnected ? (
              <Wifi size={14} color="#4CAF50" />
            ) : (
              <WifiOff size={14} color="#F44336" />
            )}
            <Text style={[
              styles.detailText,
              { color: employee.isConnected ? '#4CAF50' : '#F44336' }
            ]}>
              {employee.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        
        {/* Contact Info */}
        {showContactInfo && (
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Phone size={14} color="#4A90E2" />
              <Text style={styles.contactText}>{employee.phone || 'No phone'}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Mail size={14} color="#4A90E2" />
              <Text style={styles.contactText}>{employee.email || 'No email'}</Text>
            </View>
          </View>
        )}

        {/* Status Actions Menu */}
        {showActions && showStatusActions && isManager && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleStatusAction('online')}
            >
              <Activity size={16} color="white" />
              <Text style={styles.actionText}>Set Online</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: '#FF9800' }]}
              onPress={() => handleStatusAction('break')}
            >
              <Coffee size={16} color="white" />
              <Text style={styles.actionText}>Set Break</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: '#9E9E9E' }]}
              onPress={() => handleStatusAction('offline')}
            >
              <LogOut size={16} color="white" />
              <Text style={styles.actionText}>Set Offline</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  connectionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  statusInfo: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  lastActivityText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  timeInStatusText: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
  },
  actionsButton: {
    padding: 4,
    marginBottom: 4,
  },
  navigationArrow: {
    marginTop: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  contactInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4,
  },
  actionsMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  actionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});