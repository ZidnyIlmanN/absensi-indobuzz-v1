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
import { useTranslation } from 'react-i18next';

export default function StartClientVisitScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartVisit = () => {
    Alert.alert(
      t('client_visit.start_client_visit'),
      t('client_visit.are_you_ready_start'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('client_visit.start_client_visit'),
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert(t('common.success'), t('client_visit.visit_started_success'));
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
          <Text style={styles.headerTitle}>{t('client_visit.start_client_visit')}</Text>
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
              <Text style={styles.statusTitle}>{t('client_visit.client_visit')}</Text>
            </View>
            
            <Text style={styles.statusSubtitle}>
              {t('client_visit.starting_client_visit')}
            </Text>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationText}>Client Location • Jakarta</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Visit Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('client_visit.client_visit_guidelines')}</Text>
          <Text style={styles.infoText}>
            {t('client_visit.ensure_appointment_confirmation')}{'\n'}
            {t('client_visit.location_tracking_enabled')}{'\n'}
            {t('client_visit.take_notes_outcomes')}{'\n'}
            {t('client_visit.remember_end_visit')}
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
              {isLoading ? t('common.loading') : t('client_visit.start_client_visit')}
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