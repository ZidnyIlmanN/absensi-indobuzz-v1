import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, LogOut, MapPin, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface AttendanceCardProps {
  isWorking: boolean;
  workHours: string;
  onClockIn: () => void;
  onClockOut: () => void;
  clockInTime: Date | null;
  isLoading?: boolean;
}

export function AttendanceCard({
  isWorking,
  workHours,
  onClockIn,
  onClockOut,
  clockInTime,
  isLoading = false,
}: AttendanceCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isWorking ? ['#4CAF50', '#45A049'] : ['#4A90E2', '#357ABD']}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isWorking ? '#81C784' : '#90CAF9' }]} />
            <Text style={styles.statusText}>
              {isWorking ? 'Currently Working' : 'Ready to Start'}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.workHours}>{workHours}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.mainText}>
            {isWorking ? "You're clocked in!" : "Ready to clock in?"}
          </Text>
          <Text style={styles.subText}>
            {isWorking 
              ? `Started at ${clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : "Tap the button below to start your workday"
            }
          </Text>

          <View style={styles.locationContainer}>
            <MapPin size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.locationText}>Office Location • Jakarta, Indonesia</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={isWorking ? onClockOut : onClockIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : isWorking ? (
              <LogOut size={20} color="#4A90E2" />
            ) : (
              <LogIn size={20} color="#4A90E2" />
            )}
            <Text style={styles.buttonText}>
              {isLoading 
                ? (isWorking ? 'Clocking Out...' : 'Clocking In...') 
                : (isWorking ? 'Clock Out' : 'Clock In')
              }
            </Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -30,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workHours: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  content: {
    marginBottom: 20,
  },
  mainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginLeft: 8,
  },
});