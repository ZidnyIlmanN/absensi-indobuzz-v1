import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, LogOut, Camera, Clock, MapPin } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';

export default function CheckOutScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { currentAttendance, workHours, clockOut } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClockOut = async () => {
    Alert.alert(
      'Clock Out',
      'Please take a selfie to confirm clock out',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Selfie',
          onPress: async () => {
            setIsProcessing(true);
            if (!currentAttendance) {
              Alert.alert('Error', 'No active attendance found.');
              setIsProcessing(false);
              return;
            }
            // For demo, using fixed selfie URL and empty notes
            const { error } = await clockOut('https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg', '');
            if (error) {
              Alert.alert('Error', error);
            } else {
              Alert.alert('Success', 'You have successfully clocked out!');
            }
            setIsProcessing(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#F44336', '#D32F2F']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('check_out.check_out')}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <LogOut size={32} color="white" />
              <Text style={styles.statusTitle}>{t('check_out.ready_to_clock_out')}</Text>
            </View>
            
            <Text style={styles.statusSubtitle}>
              {t('check_out.working_for', { hours: workHours })}
            </Text>


            <View style={styles.locationContainer}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationText}>Jakarta Office • Indonesia</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Work Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('check_out.todays_summary')}</Text>
          
          <View style={styles.summaryItem}>
            <Clock size={20} color="#4A90E2" />
            <Text style={styles.summaryLabel}>{t('check_out.work_hours')}</Text>
            <Text style={styles.summaryValue}>{workHours}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <LogOut size={20} color="#F44336" />
            <Text style={styles.summaryLabel}>{t('check_out.clock_in_time')}</Text>
            <Text style={styles.summaryValue}> 
              {currentAttendance?.clockIn?.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) || '--:--'}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>{t('check_out.clock_out_instructions')}</Text>
          <Text style={styles.instructionsText}>
            {t('check_out.complete_tasks')}{'\n'}
            {t('check_out.take_clear_selfie')}{'\n'}
            {t('check_out.confirm_location')}{'\n'}
            {t('check_out.review_hours')}
          </Text>
        </View>

        {/* Clock Out Button */}
        <TouchableOpacity
          style={styles.clockOutButton}
          onPress={handleClockOut}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.clockOutButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Camera size={24} color="white" />
            )}
            <Text style={styles.clockOutButtonText}>
              {isProcessing ? t('check_out.processing') : t('check_out.take_selfie_clock_out')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
  statusCard: {
    marginTop: -30,
    marginBottom: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statusGradient: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  statusSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  instructionsCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  clockOutButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  clockOutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  clockOutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
});