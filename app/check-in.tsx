import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  User,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';

const { width } = Dimensions.get('window');

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStartClockIn = () => {
    router.push('/clock-in/location');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
          <Text style={styles.headerTitle}>Presensi Masuk</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Time Display Card */}
        <View style={styles.timeCard}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.timeGradient}
          >
            <View style={styles.timeContainer}>
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
              <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
            </View>
            <View style={styles.clockIcon}>
              <Clock size={32} color="rgba(255, 255, 255, 0.8)" />
            </View>
          </LinearGradient>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Good Morning!</Text>
          <Text style={styles.welcomeSubtitle}>
            Ready to start your workday? Let's get you clocked in.
          </Text>
        </View>

        {/* Process Steps Preview */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsTitle}>Clock-In Process</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <MapPin size={20} color="#4A90E2" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select Location</Text>
                <Text style={styles.stepDescription}>Choose your work location</Text>
              </View>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Camera size={20} color="#4A90E2" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Take Selfie</Text>
                <Text style={styles.stepDescription}>Verify your identity</Text>
              </View>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <CheckCircle size={20} color="#4CAF50" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Complete</Text>
                <Text style={styles.stepDescription}>You're all set!</Text>
              </View>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Employee Info */}
        <View style={styles.employeeCard}>
          <View style={styles.employeeInfo}>
            <View style={styles.employeeIcon}>
              <User size={20} color="#4A90E2" />
            </View>
            <View style={styles.employeeDetails}>
              <Text style={styles.employeeName}>{state.user?.name}</Text>
              <Text style={styles.employeePosition}>{state.user?.position}</Text>
              <Text style={styles.employeeDepartment}>{state.user?.department}</Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartClockIn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.startButtonGradient}
          >
            <Clock size={24} color="white" />
            <Text style={styles.startButtonText}>Start Clock In</Text>
            <ChevronRight size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoText}>
            Make sure you're at your designated work location before starting the clock-in process.
          </Text>
        </View>
      </View>
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
  timeCard: {
    marginTop: -30,
    marginBottom: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  timeGradient: {
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flex: 1,
  },
  currentTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  currentDate: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  clockIcon: {
    opacity: 0.6,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsSection: {
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  stepsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 19,
    marginVertical: 4,
  },
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
  startButton: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 12,
  },
  infoNote: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
    textAlign: 'center',
  },
});