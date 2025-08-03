import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
  Grid,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Users,
  FileText,
  Settings,
  HelpCircle,
  Bell,
  ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const features = [
  { title: 'Live Attendance', icon: <TrendingUp size={24} color="#4A90E2" />, route: '/live-attendance-protected' as any },
  { title: 'Time Off', icon: <Calendar size={24} color="#FF6B6B" />, route: '/timeoff' as any },
  { title: 'Reimburse', icon: <Clock size={24} color="#4CAF50" />, route: '/reimburse' as any },
  { title: 'Attendance History', icon: <FileText size={24} color="#9C27B0" />, route: '/attendance-history' as any },
  { title: 'Shift Schedule', icon: <Clock size={24} color="#FF9800" />, route: '/shift-schedule' as any },
  { title: 'Employee', icon: <Users size={24} color="#2196F3" />, route: '/(tabs)/employee' as any },
  { title: 'Settings', icon: <Settings size={24} color="#607D8B" />, route: '/settings' as any },
  { title: 'Help', icon: <HelpCircle size={24} color="#795548" />, route: '/help' as any },
  { title: 'Notifications', icon: <Bell size={24} color="#F44336" />, route: '/notifications' as any },
];

export default function LihatSemuaScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Semua Fitur</Text>

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
