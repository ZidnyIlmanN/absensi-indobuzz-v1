import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Building, Navigation, Clock, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { OFFICE_COORDINATES } from '@/utils/location';

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  workingHours: string;
  employeeCount: number;
  distance?: number;
}

interface OfficeLocationListProps {
  onLocationFocus?: (location: OfficeLocation) => void;
  currentLocation?: { latitude: number; longitude: number };
}

export function OfficeLocationList({
  onLocationFocus,
  currentLocation,
}: OfficeLocationListProps) {
  const { t } = useTranslation();

  const calculateDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Mock office locations for PT. Indobuzz Republik Digital
  const officeLocations: OfficeLocation[] = [
    {
      id: '1',
      name: t('live_tracking.main_office'),
      address: 'PT. INDOBUZZ REPUBLIK DIGITAL',
      coordinates: OFFICE_COORDINATES,
      workingHours: '09:00 - 18:00',
      employeeCount: 12,
      distance: currentLocation ? calculateDistance(currentLocation, OFFICE_COORDINATES) : undefined,
    },
    {
      id: '2',
      name: t('live_tracking.branch_office'),
      address: 'Bandung Branch Office',
      coordinates: {
        latitude: -6.9175,
        longitude: 107.6191,
      },
      workingHours: '08:30 - 17:30',
      employeeCount: 8,
      distance: currentLocation ? calculateDistance(currentLocation, { latitude: -6.9175, longitude: 107.6191 }) : undefined,
    },
    {
      id: '3',
      name: t('live_tracking.remote_office'),
      address: 'Surabaya Remote Hub',
      coordinates: {
        latitude: -7.2575,
        longitude: 112.7521,
      },
      workingHours: '09:00 - 18:00',
      employeeCount: 5,
      distance: currentLocation ? calculateDistance(currentLocation, { latitude: -7.2575, longitude: 112.7521 }) : undefined,
    },
  ];

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m ${t('live_tracking.away')}`;
    } else {
      return `${(distance / 1000).toFixed(1)}km ${t('live_tracking.away')}`;
    }
  };

  const handleLocationPress = (location: OfficeLocation) => {
    onLocationFocus?.(location);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Building size={20} color="#4A90E2" />
          <Text style={styles.headerTitle}>
            {t('live_tracking.office_locations')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{officeLocations.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {officeLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationCard}
            onPress={() => handleLocationPress(location)}
            activeOpacity={0.7}
          >
            <View style={styles.locationHeader}>
              <View style={styles.locationIcon}>
                <Building size={20} color="#4A90E2" />
              </View>
              
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
                
                <View style={styles.locationDetails}>
                  <View style={styles.detailItem}>
                    <Clock size={12} color="#666" />
                    <Text style={styles.detailText}>{location.workingHours}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Users size={12} color="#666" />
                    <Text style={styles.detailText}>
                      {location.employeeCount} {t('live_tracking.employees')}
                    </Text>
                  </View>
                  
                  {location.distance && (
                    <View style={styles.detailItem}>
                      <MapPin size={12} color="#666" />
                      <Text style={styles.detailText}>
                        {formatDistance(location.distance)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity style={styles.focusButton}>
                <Navigation size={16} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  focusButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 8,
    marginLeft: 8,
  },
});