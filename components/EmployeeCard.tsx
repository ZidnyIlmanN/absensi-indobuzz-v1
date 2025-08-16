import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Clock, MapPin, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { Employee } from '@/types';
import { router } from 'expo-router';

interface EmployeeCardProps {
  employee: Employee;
  onPress?: () => void;
  showContactInfo?: boolean;
  showNavigationArrow?: boolean;
  showLastUpdate?: boolean;
}

export function EmployeeCard({
  employee,
  onPress,
  showContactInfo = true,
  showNavigationArrow = true,
  showLastUpdate = false,
}: EmployeeCardProps) {
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/employee/${employee.id}` as any);
    }
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
        return 'Working';
      case 'break':
        return 'On Break';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getLastUpdateTime = () => {
    if (employee.currentAttendance?.clockIn) {
      const now = new Date();
      const clockIn = new Date(employee.currentAttendance.clockIn);
      const diff = now.getTime() - clockIn.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      return clockIn.toLocaleDateString();
    }
    return 'No recent activity';
  };
  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.employeeHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=50`
              }} 
              style={styles.avatar} 
            />
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(employee.status) }
              ]}
            />
          </View>
          
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employee.name}</Text>
            <Text style={styles.employeeId}>ID: {employee.employeeId}</Text>
            <Text style={styles.employeePosition}>{employee.position || 'No position'}</Text>
            <Text style={styles.employeeDepartment}>{employee.department || 'No department'}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(employee.status) }
            ]}>
              {getStatusText(employee.status)}
            </Text>
            {showLastUpdate && (
              <Text style={styles.lastUpdateText}>
                {getLastUpdateTime()}
              </Text>
            )}
            {employee.joinDate && (
              <Text style={styles.joinDate}>
                Joined: {new Date(employee.joinDate).toLocaleDateString()}
              </Text>
            )}
            {showNavigationArrow && (
              <ChevronRight size={16} color="#C7C7CC" style={styles.navigationArrow} />
            )}
          </View>
        </View>
        
        <View style={styles.employeeDetails}>
          <View style={styles.detailItem}>
            <Clock size={14} color="#666" />
            <Text style={styles.detailText}>{employee.workHours || '09:00-18:00'}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={14} color="#666" />
            <Text style={styles.detailText}>{employee.location || 'No location'}</Text>
          </View>
        </View>
        
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

        {/* Tap indicator */}
        <View style={styles.tapIndicator}>
          <Text style={styles.tapIndicatorText}>Tap to view details</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
  employeeHeader: {
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
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
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
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  lastUpdateText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  },
  joinDate: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
  },
  navigationArrow: {
    marginTop: 4,
  },
  employeeDetails: {
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
  tapIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  tapIndicatorText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});