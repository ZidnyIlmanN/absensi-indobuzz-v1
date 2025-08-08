import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Clock, MapPin, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { Employee } from '@/types';
import { router } from 'expo-router';

interface EmployeeListItemProps {
  employee: Employee;
  onPress?: () => void;
  compact?: boolean;
}

export function EmployeeListItem({
  employee,
  onPress,
  compact = false,
}: EmployeeListItemProps) {
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

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=${compact ? '40' : '50'}`
            }} 
            style={[styles.avatar, compact && styles.compactAvatar]} 
          />
          <View
            style={[
              styles.statusIndicator,
              compact && styles.compactStatusIndicator,
              { backgroundColor: getStatusColor(employee.status) }
            ]}
          />
        </View>
        
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, compact && styles.compactName]}>
            {employee.name}
          </Text>
          <Text style={[styles.employeeId, compact && styles.compactId]}>
            ID: {employee.employeeId}
          </Text>
          <Text style={[styles.employeePosition, compact && styles.compactPosition]}>
            {employee.position || 'No position'}
          </Text>
          {!compact && (
            <Text style={styles.employeeDepartment}>
              {employee.department || 'No department'}
            </Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            compact && styles.compactStatusText,
            { color: getStatusColor(employee.status) }
          ]}>
            {getStatusText(employee.status)}
          </Text>
          <ChevronRight size={compact ? 14 : 16} color="#C7C7CC" />
        </View>
      </View>
      
      {!compact && (
        <>
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Clock size={14} color="#666" />
              <Text style={styles.detailText}>{employee.workHours || '09:00-18:00'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MapPin size={14} color="#666" />
              <Text style={styles.detailText}>{employee.location || 'No location'}</Text>
            </View>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Phone size={12} color="#4A90E2" />
              <Text style={styles.contactText}>{employee.phone || 'No phone'}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Mail size={12} color="#4A90E2" />
              <Text style={styles.contactText}>{employee.email || 'No email'}</Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  compactContainer: {
    padding: 12,
    marginBottom: 8,
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
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  compactStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    bottom: 1,
    right: 1,
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
  compactName: {
    fontSize: 14,
  },
  employeeId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  compactId: {
    fontSize: 11,
  },
  employeePosition: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  compactPosition: {
    fontSize: 12,
    marginBottom: 0,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  compactStatusText: {
    fontSize: 11,
    marginBottom: 2,
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
});