import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  ArrowLeft,
  MapPin,
  Users,
  Building,
  Navigation,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { DraggableModalContainer } from '@/components/DraggableModalContainer';
import { LiveTrackingModal } from '@/components/LiveTrackingModal';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

export default function LiveTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, currentAttendance } = useAppContext();
  const mapRef = useRef<MapView>(null);
  
  const [showModal, setShowModal] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  const {
    employees,
    officeLocations,
    currentLocation,
    isLoading,
    error,
    refreshData,
  } = useLiveTracking({
    enableRealTimeTracking: true,
    trackingInterval: 5000, // Update every 5 seconds
  });

  // Initial map region (centered on Jakarta office)
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Check if user is working to show/hide the component
  const isWorking = currentAttendance && currentAttendance.status !== 'completed';

  useEffect(() => {
    if (!isWorking) {
      // If user is not working, redirect back
      router.back();
    }
  }, [isWorking]);

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && employee.currentLocation && mapRef.current) {
      setSelectedEmployeeId(employeeId);
      setSelectedOfficeId(null);
      
      // Focus map on employee location
      const region: Region = {
        latitude: employee.currentLocation.latitude,
        longitude: employee.currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const handleOfficeSelect = (officeId: string) => {
    const office = officeLocations.find(loc => loc.id === officeId);
    if (office && mapRef.current) {
      setSelectedOfficeId(officeId);
      setSelectedEmployeeId(null);
      
      // Focus map on office location
      const region: Region = {
        latitude: office.coordinates.latitude,
        longitude: office.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
    setShowModal(!isMapFullscreen);
  };

  const resetMapView = () => {
    if (mapRef.current) {
      setSelectedEmployeeId(null);
      setSelectedOfficeId(null);
      mapRef.current.animateToRegion(mapRegion, 1000);
    }
  };

  const getEmployeeMarkerColor = (employee: any) => {
    switch (employee.status) {
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

  // Don't render if user is not working
  if (!isWorking) {
    return null;
  }

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
              {employees.filter(emp => emp.status === 'online').length} {t('live_tracking.employees_online')}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleMapFullscreen}
            >
              {isMapFullscreen ? (
                <Minimize2 size={20} color="white" />
              ) : (
                <Maximize2 size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Map Container */}
      <View style={[
        styles.mapContainer,
        isMapFullscreen && styles.mapFullscreen
      ]}>
        {Platform.OS === 'web' ? (
          // Fallback for web platform
          <View style={styles.mapFallback}>
            <MapPin size={64} color="#E0E0E0" />
            <Text style={styles.mapFallbackText}>
              {t('live_tracking.map_not_available_web')}
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            onRegionChangeComplete={setMapRegion}
          >
            {/* Employee Markers */}
            {employees
              .filter(emp => emp.currentLocation && emp.status === 'online')
              .map((employee) => (
                <Marker
                  key={employee.id}
                  coordinate={{
                    latitude: employee.currentLocation!.latitude,
                    longitude: employee.currentLocation!.longitude,
                  }}
                  title={employee.name}
                  description={`${employee.position} • ${employee.department}`}
                  pinColor={getEmployeeMarkerColor(employee)}
                  onPress={() => handleEmployeeSelect(employee.id)}
                />
              ))}

            {/* Office Location Markers */}
            {officeLocations.map((office) => (
              <Marker
                key={office.id}
                coordinate={{
                  latitude: office.coordinates.latitude,
                  longitude: office.coordinates.longitude,
                }}
                title={office.name}
                description={office.address}
                pinColor="#F44336"
                onPress={() => handleOfficeSelect(office.id)}
              />
            ))}
          </MapView>
        )}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={resetMapView}
          >
            <Navigation size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>{t('live_tracking.updating_locations')}</Text>
          </View>
        )}
      </View>

      {/* Draggable Modal */}
      {!isMapFullscreen && (
        <DraggableModalContainer
          visible={showModal}
          onClose={() => setShowModal(false)}
          enableDrag={true}
          dismissThreshold={0.4}
          snapThreshold={0.2}
        >
          <LiveTrackingModal
            employees={employees}
            officeLocations={officeLocations}
            selectedEmployeeId={selectedEmployeeId}
            selectedOfficeId={selectedOfficeId}
            onEmployeeSelect={handleEmployeeSelect}
            onOfficeSelect={handleOfficeSelect}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            error={error}
          />
        </DraggableModalContainer>
      )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  mapFallbackText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
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
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});