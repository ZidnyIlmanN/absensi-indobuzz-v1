import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Phone, Mail, MessageCircle, MapPin, ExternalLink } from 'lucide-react-native';
import { Employee } from '@/types';

interface EmployeeContactCardProps {
  employee: Employee;
  showActions?: boolean;
}

export function EmployeeContactCard({
  employee,
  showActions = true,
}: EmployeeContactCardProps) {
  const handleCall = () => {
    if (employee.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    } else {
      Alert.alert('No Phone Number', 'This employee has no phone number on file.');
    }
  };

  const handleEmail = () => {
    if (employee.email) {
      Linking.openURL(`mailto:${employee.email}`);
    } else {
      Alert.alert('No Email', 'This employee has no email address on file.');
    }
  };

  const handleMessage = () => {
    Alert.alert('Message', 'Internal messaging feature coming soon!');
  };

  const handleLocationView = () => {
    if (employee.location) {
      Alert.alert('Location', `Employee location: ${employee.location}`);
    } else {
      Alert.alert('No Location', 'No location information available.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact Information</Text>
      
      <View style={styles.contactList}>
        {/* Phone */}
        <TouchableOpacity 
          style={[styles.contactItem, !employee.phone && styles.disabledItem]}
          onPress={showActions ? handleCall : undefined}
          disabled={!employee.phone}
          activeOpacity={0.7}
        >
          <View style={styles.contactIcon}>
            <Phone size={20} color={employee.phone ? "#4CAF50" : "#E0E0E0"} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Phone Number</Text>
            <Text style={[
              styles.contactValue,
              !employee.phone && styles.disabledText
            ]}>
              {employee.phone || 'Not provided'}
            </Text>
          </View>
          {showActions && employee.phone && (
            <ExternalLink size={16} color="#C7C7CC" />
          )}
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={showActions ? handleEmail : undefined}
          activeOpacity={0.7}
        >
          <View style={styles.contactIcon}>
            <Mail size={20} color="#2196F3" />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Email Address</Text>
            <Text style={styles.contactValue}>{employee.email}</Text>
          </View>
          {showActions && (
            <ExternalLink size={16} color="#C7C7CC" />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      {showActions && (
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, !employee.phone && styles.disabledButton]}
            onPress={handleCall}
            disabled={!employee.phone}
          >
            <Phone size={16} color={employee.phone ? "white" : "#E0E0E0"} />
            <Text style={[
              styles.actionButtonText,
              !employee.phone && styles.disabledButtonText
            ]}>
              Call
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Mail size={16} color="white" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <MessageCircle size={16} color="white" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  contactList: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  disabledItem: {
    opacity: 0.5,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  disabledText: {
    color: '#E0E0E0',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  disabledButtonText: {
    color: '#999',
  },
});