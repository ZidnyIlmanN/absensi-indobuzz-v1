import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Clock, MapPin, ChevronRight } from 'lucide-react-native';
import { Employee } from '@/types';
import { router } from 'expo-router';

interface EmployeeSearchCardProps {
  employee: Employee;
  searchQuery?: string;
  onPress?: () => void;
}

export function EmployeeSearchCard({
  employee,
  searchQuery,
  onPress,
}: EmployeeSearchCardProps) {
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

  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text key={index} style={styles.highlightedText}>{part}</Text>
      ) : (
        part
      )
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=40`
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
          <Text style={styles.employeeName}>
            {highlightText(employee.name, searchQuery)}
          </Text>
          <Text style={styles.employeePosition}>
            {highlightText(employee.position || 'No position', searchQuery)}
          </Text>
          <Text style={styles.employeeDepartment}>
            {highlightText(employee.department || 'No department', searchQuery)}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(employee.status) }
          ]}>
            {getStatusText(employee.status)}
          </Text>
          <ChevronRight size={16} color="#C7C7CC" />
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Clock size={12} color="#666" />
          <Text style={styles.detailText}>{employee.workHours || '09:00-18:00'}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <MapPin size={12} color="#666" />
          <Text style={styles.detailText}>{employee.location || 'No location'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 12,
    color: '#4A90E2',
    marginBottom: 1,
  },
  employeeDepartment: {
    fontSize: 11,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
  },
  highlightedText: {
    backgroundColor: '#FFEB3B',
    fontWeight: '600',
  },
});