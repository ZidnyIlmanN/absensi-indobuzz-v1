import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MapPin, Users, Building, Navigation, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface MapFallbackProps {
  employees: any[];
  officeLocations: any[];
  currentLocation?: { latitude: number; longitude: number };
  onEmployeeFocus?: (employee: any) => void;
  onLocationFocus?: (location: any) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function MapFallback({
  employees,
  officeLocations,
  currentLocation,
  onEmployeeFocus,
  onLocationFocus,
  onRefresh,
  isRefreshing = false,
}: MapFallbackProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'break':
        return '#FF9800';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#4A90E2';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MapPin size={20} color="#F44336" />
          <Text style={styles.headerTitle}>Map Unavailable</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw 
            size={16} 
            color="#4A90E2" 
            style={isRefreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.fallbackMessage}>
        The interactive map is currently unavailable. Here's a list view of all tracked locations and employees.
      </Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Location */}
        {currentLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Navigation size={20} color="#4A90E2" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>Current Position</Text>
                <Text style={styles.locationCoords}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Office Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Office Locations ({officeLocations.length})
          </Text>
          {officeLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationCard}
              onPress={() => onLocationFocus?.(location)}
              activeOpacity={0.7}
            >
              <View style={styles.locationIcon}>
                <Building size={20} color="#2196F3" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
                <Text style={styles.locationCoords}>
                  {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Employees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Employees ({employees.length})
          </Text>
          {employees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.employeeCard}
              onPress={() => onEmployeeFocus?.(employee)}
              activeOpacity={0.7}
            >
              <View style={styles.employeeHeader}>
                <Image
                  source={{
                    uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=40`
                  }}
                  style={styles.employeeAvatar}
                />
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(employee.status) }
                  ]}
                />
              </View>
              
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeePosition}>{employee.position}</Text>
                <Text style={styles.employeeStatus}>
                  Status: {employee.status}
                </Text>
                {employee.liveLocation && (
                  <Text style={styles.employeeLocation}>
                    {employee.liveLocation.location.latitude.toFixed(4)}, {employee.liveLocation.location.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#E3F2FD',
    margin: 16,
    borderRadius: 8,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
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
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  employeeHeader: {
    position: 'relative',
    marginRight: 12,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  employeeStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  employeeLocation: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
});