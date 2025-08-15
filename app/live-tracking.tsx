import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
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
  Navigation,
  RefreshCw,
  Map as MapIcon,
  List,
  ToggleLeft,
  ToggleRight,
  Wifi,
  WifiOff,
  Activity,
  Building,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { LiveTrackingStats } from '@/components/LiveTrackingStats';
import { LiveEmployeeList } from '@/components/LiveEmployeeList';
import { OfficeLocationList } from '@/components/OfficeLocationList';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';
import { MapFallback } from '@/components/MapFallback';
import { LeafletMap, LeafletMapRef } from '@/components/LeafletMap';
import { createEmployeeMarker, createOfficeMarker, calculateBounds } from '@/utils/mapUtils';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

type ViewMode = 'map' | 'list';

export default function LiveTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapRef = useRef<LeafletMapRef>(null);
  
  // Hooks
  const {
    employees,
    officeLocations,
    stats,
    isLoading,
    error,
    refreshData,
  } = useLiveTracking({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enableRealTimeUpdates: true,
  });

  const {
    currentLocation,
    isWithinOfficeRange,
    distanceFromOffice,
    refreshLocation,
  } = useLocationTracking({
    enableRealTimeTracking: true,
    trackingInterval: 10000, // 10 seconds
  });

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [focusedEmployee, setFocusedEmployee] = useState<string | null>(null);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  // Check network connectivity
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simulate network check
    const checkNetwork = () => {
      // In a real app, you'd use @react-native-community/netinfo
      setIsOnline(true);
    };
    
    checkNetwork();
    const interval = setInterval(checkNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        refreshLocation(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Refresh Failed', 'Unable to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmployeeFocus = (employee: any) => {
    if (viewMode === 'map' && mapRef.current && employee.liveLocation) {
      const position: [number, number] = [
        employee.liveLocation.location.latitude,
        employee.liveLocation.location.longitude,
      ];
      
      mapRef.current.setView(position, 16);
      setFocusedEmployee(employee.id);
      
      // Show focus message
      Alert.alert(
        t('live_tracking.employee_location'),
        t('live_tracking.focusing_on_employee', { name: employee.name })
      );
    }
  };

  const handleOfficeFocus = (office: any) => {
    if (viewMode === 'map' && mapRef.current) {
      const position: [number, number] = [
        office.coordinates.latitude,
        office.coordinates.longitude,
      ];
      
      mapRef.current.setView(position, 15);
      
      Alert.alert(
        t('live_tracking.office_location'),
        t('live_tracking.focusing_on_office', { name: office.name })
      );
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
    setMapError(null);
    console.log('Map is ready');
  };

  const handleMapError = (error: any) => {
    setMapError(error.message || 'Map failed to load');
    console.error('Map error:', error);
  };

  // Create markers for map
  const mapMarkers = React.useMemo(() => {
    const markers = [];
    
    // Add employee markers
    employees.forEach(employee => {
      const marker = createEmployeeMarker(employee);
      if (marker) {
        markers.push(marker);
      }
    });
    
    // Add office markers
    officeLocations.forEach(office => {
      markers.push(createOfficeMarker(office));
    });
    
    return markers;
  }, [employees, officeLocations]);

  // Calculate map center
  const mapCenter: [number, number] = React.useMemo(() => {
    if (currentLocation) {
      return [currentLocation.latitude, currentLocation.longitude];
    }
    
    if (officeLocations.length > 0) {
      return [
        officeLocations[0].coordinates.latitude,
        officeLocations[0].coordinates.longitude,
      ];
    }
    
    // Default to Jakarta
    return [-6.2088, 106.8456];
  }, [currentLocation, officeLocations]);

  const renderMapView = () => {
    if (Platform.OS === 'web') {
      return (
        <MapFallback
          employees={employees}
          officeLocations={officeLocations}
          currentLocation={currentLocation}
          onEmployeeFocus={handleEmployeeFocus}
          onLocationFocus={handleOfficeFocus}
          onRefresh={onRefresh}
          isRefreshing={refreshing}
        />
      );
    }

    return (
      <MapErrorBoundary
        onError={handleMapError}
        fallbackComponent={
          <MapFallback
            employees={employees}
            officeLocations={officeLocations}
            currentLocation={currentLocation}
            onEmployeeFocus={handleEmployeeFocus}
            onLocationFocus={handleOfficeFocus}
            onRefresh={onRefresh}
            isRefreshing={refreshing}
          />
        }
      >
        <LeafletMap
          ref={mapRef}
          center={mapCenter}
          zoom={13}
          markers={mapMarkers}
          onMarkerClick={(marker) => {
            if (marker.type === 'employee' && marker.employee) {
              handleEmployeeFocus(marker.employee);
            } else if (marker.type === 'office') {
              handleOfficeFocus(marker);
            }
          }}
          onMapReady={handleMapReady}
          showUserLocation={true}
          userLocation={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : undefined}
          style={styles.map}
        />
      </MapErrorBoundary>
    );
  };

  const renderListView = () => (
    <ScrollView 
      style={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LiveEmployeeList
        onEmployeeFocus={handleEmployeeFocus}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      
      <OfficeLocationList
        onLocationFocus={handleOfficeFocus}
        currentLocation={currentLocation}
      />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('live_tracking.live_tracking')}</Text>
            <Text style={styles.headerSubtitle}>
              {stats.activeEmployees} {t('live_tracking.employees_active')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.connectionStatus}>
              {isOnline ? (
                <Wifi size={16} color="rgba(255, 255, 255, 0.8)" />
              ) : (
                <WifiOff size={16} color="#FF6B6B" />
              )}
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw 
                size={16} 
                color="white" 
                style={refreshing ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'map' && styles.activeViewMode]}
            onPress={() => setViewMode('map')}
          >
            <MapIcon size={16} color={viewMode === 'map' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} />
            <Text style={[
              styles.viewModeText,
              viewMode === 'map' && styles.activeViewModeText
            ]}>
              Map
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? '#4A90E2' : 'rgba(255,255,255,0.8)'} />
            <Text style={[
              styles.viewModeText,
              viewMode === 'list' && styles.activeViewModeText
            ]}>
              List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Status */}
        {currentLocation && (
          <View style={styles.locationStatus}>
            <View style={styles.locationStatusContent}>
              <Navigation size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.locationStatusText}>
                {isWithinOfficeRange 
                  ? t('live_tracking.tracking_active')
                  : t('live_tracking.location_unavailable')
                }
              </Text>
              <View style={[
                styles.statusDot,
                { backgroundColor: isWithinOfficeRange ? '#4CAF50' : '#FF9800' }
              ]} />
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {isLoading && employees.length === 0 ? (
          <LoadingSpinner text={t('live_tracking.loading_map')} />
        ) : error ? (
          <EmptyState
            icon={<MapPin size={48} color="#E0E0E0" />}
            title={t('common.error')}
            message={error}
            actionText={t('common.retry')}
            onAction={onRefresh}
          />
        ) : (
          <>
            {/* Stats */}
            <LiveTrackingStats stats={stats} />
            
            {/* Main Content */}
            {viewMode === 'map' ? (
              <View style={styles.mapContainer}>
                {renderMapView()}
                
                {/* Map Controls */}
                <View style={styles.mapControls}>
                  <TouchableOpacity
                    style={styles.mapControlButton}
                    onPress={() => {
                      if (currentLocation && mapRef.current) {
                        mapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 15);
                      }
                    }}
                  >
                    <Navigation size={16} color="#4A90E2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.mapControlButton}
                    onPress={() => {
                      if (mapMarkers.length > 0 && mapRef.current) {
                        const bounds = calculateBounds(mapMarkers.map(m => m.position));
                        mapRef.current.fitBounds([bounds.southwest, bounds.northeast]);
                      }
                    }}
                  >
                    <MapIcon size={16} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              renderListView()
            )}
          </>
        )}
      </View>

      {/* Status Indicator */}
      <View style={styles.statusIndicator}>
        <View style={styles.statusDot}>
          <Activity size={16} color="#4CAF50" />
        </View>
        <Text style={styles.statusText}>
          {t('live_tracking.tracking_active')} • {stats.activeEmployees} {t('live_tracking.employees')} • {t('common.last_sync')}: {new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    width: 20,
    alignItems: 'center',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeViewMode: {
    backgroundColor: 'white',
  },
  viewModeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeViewModeText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  locationStatus: {
    alignItems: 'center',
  },
  locationStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: 'white',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContainer: {
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
  },
});