import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Users, MapPin, Clock, Building } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/Colors';

interface LiveTrackingStatsProps {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    onBreakEmployees: number;
    officeLocations: number;
  };
}

export function LiveTrackingStats({ stats }: LiveTrackingStatsProps) {
  const { t } = useTranslation();

  const statItems = [
    {
      icon: Users,
      value: stats.activeEmployees,
      label: t('live_tracking.active_employees'),
      color: Colors.primary,
      backgroundColor: '#E3F2FD',
      iconColor: Colors.primary,
    },
    {
      icon: Clock,
      value: stats.onBreakEmployees,
      label: t('live_tracking.on_break'),
      color: Colors.warning,
      backgroundColor: '#FFF3E0',
      iconColor: Colors.warning,
    },
    {
      icon: Building,
      value: stats.officeLocations,
      label: t('live_tracking.office_locations'),
      color: Colors.success,
      backgroundColor: '#E8F5E8',
      iconColor: Colors.success,
    },
    {
      icon: MapPin,
      value: stats.totalEmployees,
      label: t('live_tracking.total_tracked'),
      color: '#9C27B0',
      backgroundColor: '#F3E5F5',
      iconColor: '#9C27B0',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('live_tracking.tracking_overview')}</Text>
        <View style={styles.divider} />
      </View>
      
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.cardContent, { backgroundColor: item.backgroundColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.white }]}>
                <item.icon size={24} color={item.iconColor} strokeWidth={2.5} />
              </View>
              <Text style={[styles.statValue, { color: item.color }]}>
                {item.value.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,

  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  divider: {
    height: 2,
    width: 40,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: Colors.surface,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  iconContainer: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
    opacity: 0.8,
  },
});
