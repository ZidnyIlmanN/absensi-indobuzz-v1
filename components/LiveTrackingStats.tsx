import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Users, MapPin, Clock, Building } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
      icon: <Users size={20} color="#4A90E2" />,
      value: stats.activeEmployees,
      label: t('live_tracking.active_employees'),
      color: '#E3F2FD',
    },
    {
      icon: <Clock size={20} color="#FF9800" />,
      value: stats.onBreakEmployees,
      label: t('live_tracking.on_break'),
      color: '#FFF3E0',
    },
    {
      icon: <Building size={20} color="#4CAF50" />,
      value: stats.officeLocations,
      label: t('live_tracking.office_locations'),
      color: '#E8F5E8',
    },
    {
      icon: <MapPin size={20} color="#9C27B0" />,
      value: stats.totalEmployees,
      label: t('live_tracking.total_tracked'),
      color: '#F3E5F5',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('live_tracking.tracking_overview')}</Text>
      
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: item.color }]}>
            <View style={styles.statIcon}>
              {item.icon}
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});