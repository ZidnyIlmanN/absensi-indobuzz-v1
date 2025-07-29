import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, MapPin } from 'lucide-react-native';

export default function StartClientVisitScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartVisit = () => {
    Alert.alert(
      'Start Client Visit',
      'Are you ready to start your client visit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Visit',
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert('Success', 'Client visit started successfully!');
              router.back();
            }, 1000);
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
        colors={['#9C27B0', '#7B1FA2']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mulai Kunjungan Klien</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['#9C27B0', '#7B1FA2']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <User size={32} color="white" />
              <Text style={styles.statusTitle}>Client Visit</Text>
            </View>
            
            <Text style={styles.statusSubtitle}>
              Starting your client visit. Make sure to track your location and activities.
            </Text>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationText}>Client Location • Jakarta</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Visit Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Client Visit Guidelines</Text>
          <Text style={styles.infoText}>
            • Ensure you have client appointment confirmation{'\n'}
            • Location tracking will be enabled{'\n'}
            • Take notes of meeting outcomes{'\n'}
            • Remember to end visit when completed
          </Text>
        </View>

        {/* Start Visit Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartVisit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9C27B0', '#7B1FA2']}
            style={styles.startButtonGradient}
          >
            <User size={24} color="white" />
            <Text style={styles.startButtonText}>
              {isLoading ? 'Starting...' : 'Start Client Visit'}
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
  infoCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1B9A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6A1B9A',
    lineHeight: 20,
  },
  startButton: {
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
    marginLeft: 12,
  },
});