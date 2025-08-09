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
import { ArrowLeft, RotateCcw, Clock, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function EndOvertimeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleEndOvertime = () => {
    Alert.alert(
      t('overtime.end_overtime'),
      t('overtime.are_you_ready_end'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('overtime.end_overtime'),
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert(t('common.success'), t('overtime.overtime_ended_success'));
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
          <Text style={styles.headerTitle}>{t('overtime.end_overtime')}</Text>
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
              <RotateCcw size={32} color="white" />
              <Text style={styles.statusTitle}>{t('overtime.end_overtime_work')}</Text>
            </View>
            
            <Text style={styles.statusSubtitle}>
              {t('overtime.great_job_extra_hours')}
            </Text>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationText}>Jakarta Office • Indonesia</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Overtime Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('overtime.overtime_summary')}</Text>
          
          <View style={styles.summaryItem}>
            <Clock size={20} color="#FF9800" />
            <Text style={styles.summaryLabel}>{t('overtime.overtime_duration')}</Text>
            <Text style={styles.summaryValue}>3.5 hours</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <RotateCcw size={20} color="#4A90E2" />
            <Text style={styles.summaryLabel}>{t('overtime.overtime_started')}</Text>
            <Text style={styles.summaryValue}>6:00 PM</Text>
          </View>
        </View>

        {/* End Overtime Button */}
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndOvertime}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.endButtonGradient}
          >
            <RotateCcw size={24} color="white" />
            <Text style={styles.endButtonText}>
              {isLoading ? t('common.loading') : t('overtime.end_overtime')}
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
    marginBottom: 32,
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
  endButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  endButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
});