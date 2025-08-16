import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Activity, Wifi, WifiOff } from 'lucide-react-native';
import { Employee } from '@/types';

interface EmployeeStatusIndicatorProps {
  employee: Employee;
  showLastUpdate?: boolean;
  onStatusPress?: () => void;
  enableRealTimeIndicator?: boolean;
}

export function EmployeeStatusIndicator({
  employee,
  showLastUpdate = false,
  onStatusPress,
  enableRealTimeIndicator = true,
}: EmployeeStatusIndicatorProps) {
  const [lastStatusUpdate, setLastStatusUpdate] = useState<Date | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(true);
  const pulseAnim = new Animated.Value(1);

  // Listen for real-time status updates for this specific employee
  useEffect(() => {
    if (!enableRealTimeIndicator) return;

    const handleStatusUpdate = (event: any) => {
      const statusUpdate = event.detail;
      
      if (statusUpdate.employeeId === employee.id) {
        setLastStatusUpdate(new Date(statusUpdate.timestamp));
        
        // Trigger pulse animation
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    // Listen for connection status changes
    const handleConnectionChange = (event: any) => {
      setIsRealTimeConnected(event.detail.connected);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('employeeStatusUpdate', handleStatusUpdate);
      window.addEventListener('realTimeConnectionChange', handleConnectionChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('employeeStatusUpdate', handleStatusUpdate);
        window.removeEventListener('realTimeConnectionChange', handleConnectionChange);
      }
    };
  }, [employee.id, enableRealTimeIndicator]);

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

  const formatLastUpdate = () => {
    if (!lastStatusUpdate) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastStatusUpdate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just updated';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onStatusPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.statusContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <View style={[
          styles.statusDot,
          { backgroundColor: getStatusColor(employee.status) }
        ]} />
        
        <View style={styles.statusInfo}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(employee.status) }
          ]}>
            {getStatusText(employee.status)}
          </Text>
          
          {showLastUpdate && lastStatusUpdate && (
            <Text style={styles.lastUpdateText}>
              {formatLastUpdate()}
            </Text>
          )}
        </View>

        {enableRealTimeIndicator && (
          <View style={styles.connectionIndicator}>
            {isRealTimeConnected ? (
              <Wifi size={12} color="#4CAF50" />
            ) : (
              <WifiOff size={12} color="#F44336" />
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusInfo: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  connectionIndicator: {
    marginLeft: 6,
  },
});