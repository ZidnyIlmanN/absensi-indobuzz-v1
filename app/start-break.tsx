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
import { ArrowLeft, Coffee, Clock, MapPin } from 'lucide-react-native';

export default function StartBreakScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartBreak = () => {
    Alert.alert(
      'Start Break',
      'Are you sure you want to start your break?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Break',
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert('Success', 'Break started successfully!');
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
        colors={['#FF9800', '#F57C00']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mulai Istirahat</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <Coffee size={32} color="white" />
              <Text style={styles.statusTitle}>Time for a Break!</Text>
            </View>
            
            <Text style={styles.statusSubtitle}>
              Take a well-deserved break. Remember to clock back in when you return.
            </Text>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationText}>Jakarta Office • Indonesia</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Break Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Break Guidelines</Text>
          <Text style={styles.infoText}>
            • Standard break duration: 30-60 minutes{'\n'}
            • Stay within office premises{'\n'}
            • Remember to end break when returning{'\n'}
            • Break time will be tracked automatically
          </Text>
        </View>

        {/* Start Break Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartBreak}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.startButtonGradient}
          >
            <Coffee size={24} color="white" />
            <Text style={styles.startButtonText}>
              {isLoading ? 'Starting...' : 'Start Break'}
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
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#F57C00',
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