import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Grid2x2 as Grid, TrendingUp, Calendar, Clock, DollarSign, Users, FileText, Settings, CircleHelp as HelpCircle, Bell, ArrowLeft, Camera, Heart, MapPin } from 'lucide-react-native';
import { Cloud } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function LihatSemuaScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const features = [
    { title: t('all_features.live_attendance'), icon: <TrendingUp size={24} color="#4A90E2" />, route: '/live-attendance-protected' as any },
    { title: t('all_features.live_tracking'), icon: <MapPin size={24} color="#2196F3" />, route: '/live-tracking' as any },
    { title: t('all_features.request_permission'),  icon: <Calendar size={24} color="#FF6B6B" />, route: '/ajukan-izin' as any },
    { title: t('all_features.sick_leave'), icon: <Heart size={24} color="#F44336" />, route: '/sakit' as any },
    { title: t('all_features.reimburse'), icon: <Clock size={24} color="#4CAF50" />, route: '/reimburse' as any },
    { title: t('all_features.attendance_history'), icon: <FileText size={24} color="#9C27B0" />, route: '/attendance-history' as any },
    { title: t('all_features.shift_schedule'), icon: <Clock size={24} color="#FF9800" />, route: '/shift-schedule' as any },
    { title: t('all_features.employee'), icon: <Users size={24} color="#2196F3" />, route: '/(tabs)/employee' as any },
    { title: t('all_features.settings'), icon: <Settings size={24} color="#607D8B" />, route: '/settings' as any },
    { title: t('all_features.help'), icon: <HelpCircle size={24} color="#795548" />, route: '/help' as any },
    { title: t('all_features.notifications'), icon: <Bell size={24} color="#F44336" />, route: '/notifications' as any },
    { title: t('all_features.selfie_gallery'), icon: <Camera size={24} color="#E91E63" />, route: '/selfie-gallery' as any },
    { title: t('all_features.weather_details'), icon: <Cloud size={24} color="#87CEEB" />, route: '/weather-details' as any },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>{t('all_features.all_features')}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={styles.featureItem}
            onPress={() => router.push(feature.route)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>{feature.icon}</View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconContainer: {
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
