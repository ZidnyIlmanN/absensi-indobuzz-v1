import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Users,
  Building,
  Navigation,
  RefreshCw,
  Settings,
  Maximize,
  Clock,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useEmployees } from '@/hooks/useEmployees';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { OFFICE_COORDINATES } from '@/utils/location';
import { DraggableModal } from '@/components/DraggableModal';
import { LiveEmployeeList } from '@/components/LiveEmployeeList';
import { OfficeLocationList } from '@/components/OfficeLocationList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { Employee } from '@/types';
import { LeafletMap } from '@/components/LeafletMap';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';
import { MapFallback } from '@/components/MapFallback';

const { width, height } = Dimensions.get('window');

export default function LiveTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapRef = useRef<any>(null);
  const {
    employees: trackingEmployees,
    officeLocations,
    stats,
    isLoading,
    error,
    refreshData,
  } = useLiveTracking({
    autoRefresh: true,
    refreshInterval: 30000,
    enableRealTimeUpdates: true,
  });
  
  const {
    currentLocation,
    isLoading: locationLoading,
    error: locationError,
    refreshLocation,
  } = useLocationTracking({
    enableRealTimeTracking: true,
    trackingInterval: 10000,
  });

  const [activeTab, setActiveTab] = useState<'employees' | 'locations'>('employees');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Filter working employees
  const activeEmployees = trackingEmployees.filter(emp => 
    emp.status === 'online' || emp.status === 'break'
  );
  
  console.log('Live tracking screen - Total employees:', trackingEmployees.length);
  console.log('Live tracking screen - Active employees:', activeEmployees.length);

  useEffect(() => {
    // Initial data load
    refreshData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        refreshLocation(),
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), t('live_tracking.refresh_failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEmployeeFocus = (employee: Employee) => {
    if (!mapRef.current || !employee.currentAttendance?.location) return;

    const { latitude, longitude } = employee.currentAttendance.location;
    
    // Focus on employee location using Leaflet map
    if (mapRef.current && mapRef.current.setView) {
      mapRef.current.setView([latitude, longitude], 16);
    }

    Alert.alert(
      t('live_tracking.employee_location'),
      t('live_tracking.focusing_on_employee', { name: employee.name }),
      [{ text: t('common.ok') }]
    );
  };

  const handleLocationFocus = (location: any) => {
    if (!mapRef.current) return;

    // Focus on office location using Leaflet map
    if (mapRef.current && mapRef.current.setView) {
      mapRef.current.setView([location.coordinates.latitude, location.coordinates.longitude], 15);
    }

    Alert.alert(
      t('live_tracking.office_location'),
      t('live_tracking.focusing_on_office', { name: location.name }),
      [{ text: t('common.ok') }]
    );
  };

  const handleSnapPointChange = (index: number) => {
    console.log('Modal snap point changed to:', index);
  };

  // Use live location data from tracking service
  const employeeLocations = activeEmployees.filter(emp => emp.liveLocation);

  const getMarkerColor = (status: string) => {
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

  // Prepare markers for the map
  const mapMarkers = [
    // Office locations
    ...officeLocations.map(office => ({
      id: `office-${office.id}`,
      position: [office.coordinates.latitude, office.coordinates.longitude] as [number, number],
      title: office.name,
      description: office.address,
      color: '#2196F3',
      type: 'office' as const,
    })),
    // Employee locations
    ...employeeLocations.map(employee => ({
      id: `employee-${employee.id}`,
      position: [
        employee.liveLocation!.location.latitude,
        employee.liveLocation!.location.longitude
      ] as [number, number],
      title: employee.name,
      description: `${employee.position} • ${employee.status}`,
      color: getMarkerColor(employee.status),
      type: 'employee' as const,
      employee,
    })),
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern Professional Header */}
      <LinearGradient
        colors={['#4A90E2', 'rgba(74, 144, 226, 0)']}
        locations={[0.6, 1]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContainer}>
          {/* Top Row - Navigation and Actions */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, isRefreshing && styles.refreshingButton]}
                onPress={handleRefresh}
                disabled={isRefreshing}
                activeOpacity={0.8}
              >
                <RefreshCw 
                  size={18} 
                  color="rgba(255, 255, 255, 0.9)" 
                  style={[
                    isRefreshing && styles.spinning,
                    { transform: [{ rotate: isRefreshing ? '360deg' : '0deg' }] }
                  ]}
              <Text style={styles.statNumber}>{activeEmployees.length}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Live Tracking</Text>
            <Text style={styles.headerSubtitle}>
              Real-time employee monitoring & location tracking
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Users size={16} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{workingEmployees.length}</Text>
                <Text style={styles.statLabel}>Online</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Clock size={16} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.onBreakEmployees}</Text>
                <Text style={styles.statLabel}>On Break</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Building size={16} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{officeLocations.length}</Text>
                <Text style={styles.statLabel}>Locations</Text>
              </View>
            </View>

          </View>
        </View>
      </LinearGradient>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Map error caught by boundary:', error, errorInfo);
          }}
          fallbackComponent={
          <MapFallback
            employees={employeeLocations}
            officeLocations={officeLocations}
            currentLocation={currentLocation ?? undefined}
            onEmployeeFocus={handleEmployeeFocus}
            onLocationFocus={handleLocationFocus}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          }
        >
          {locationLoading && !mapReady ? (
            <View style={styles.mapLoading}>
              <LoadingSpinner text={t('live_tracking.loading_map')} />
            </View>
          ) : (
            <LeafletMap
              ref={mapRef}
              center={[OFFICE_COORDINATES.latitude, OFFICE_COORDINATES.longitude]}
              zoom={20}
              markers={mapMarkers}
              onMarkerClick={(marker) => {
                if (marker.type === 'employee' && marker.employee) {
                  handleEmployeeFocus(marker.employee);
                }
              }}
              onMapReady={() => setMapReady(true)}
              showUserLocation={!!currentLocation}
              userLocation={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : undefined}
              style={styles.map}
            />
          )}
        </MapErrorBoundary>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (currentLocation && mapRef.current) {
                mapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 16);
              }
            }}
          >
            <Navigation size={20} color="#4A90E2" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.setView([OFFICE_COORDINATES.latitude, OFFICE_COORDINATES.longitude], 15);
              }
            }}
          >
            <Building size={20} color="#4A90E2" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current && employeeLocations.length > 0) {
                // Fit bounds to show all employee locations
                const bounds = employeeLocations.map(emp => [
                  emp.liveLocation!.location.latitude,
                  emp.liveLocation!.location.longitude
                ] as [number, number]);
                
                if (mapRef.current.fitBounds) {
                  mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
              }
            }}
          >
            <Maximize size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Draggable Bottom Modal */}
      <DraggableModal
        snapPoints={[0.25, 0.5, 0.65]}
        initialSnapPoint={0}
        onSnapPointChange={handleSnapPointChange}
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'employees' && styles.activeTab]}
            onPress={() => setActiveTab('employees')}
          >
            <Users size={16} color={activeTab === 'employees' ? '#4A90E2' : '#666'} />
            <Text style={[
              styles.tabText,
              activeTab === 'employees' && styles.activeTabText
            ]}>
              {t('live_tracking.employees')} ({activeEmployees.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'locations' && styles.activeTab]}
            onPress={() => setActiveTab('locations')}
          >
            <Building size={16} color={activeTab === 'locations' ? '#4A90E2' : '#666'} />
            <Text style={[
              styles.tabText,
              activeTab === 'locations' && styles.activeTabText
            ]}>
              {t('live_tracking.locations')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          
          {activeTab === 'employees' ? (
            <LiveEmployeeList
              onEmployeeFocus={handleEmployeeFocus}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          ) : (
            <OfficeLocationList
              onLocationFocus={handleLocationFocus}
              currentLocation={currentLocation?.latitude && currentLocation?.longitude ? currentLocation : undefined}
            />
          )}
        </View>
      </DraggableModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingBottom: 24,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backdropFilter: 'blur(10px)',
  },
  refreshingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backdropFilter: 'blur(20px)',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 12,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  mapControls: {
    position: 'absolute',
    top: 250,
    right: 20,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
});