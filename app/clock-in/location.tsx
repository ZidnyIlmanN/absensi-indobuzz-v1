import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Navigation, CircleCheck as CheckCircle, Clock, Wifi, WifiOff, ChevronRight, TriangleAlert as AlertTriangle, RefreshCw, MapPinOff, Loader } from 'lucide-react-native';
import { 
  getCurrentLocation, 
  checkOfficeProximity, 
  OFFICE_COORDINATES,
  ACCEPTABLE_RADIUS,
  LocationCoordinates 
} from '@/utils/location';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';
import { useLocationTracking } from '@/hooks/useLocationTracking';

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  coordinates: LocationCoordinates;
  distance: number;
  isInRange: boolean;
}

export default function LocationSelectionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Use the location tracking hook
  const {
    currentLocation,
    isWithinOfficeRange,
    distanceFromOffice,
    isLoading: isLoadingLocation,
    error: locationError,
    refreshLocation,
  } = useLocationTracking({
    enableRealTimeTracking: true,
    trackingInterval: 5000,
  });

  // Handle proximity changes separately to avoid dependency issues
  useEffect(() => {
    if (isWithinOfficeRange) {
      setSelectedLocation('kantor');
    } else {
      setSelectedLocation(null);
    }
  }, [isWithinOfficeRange]);

  // Create office location object based on tracking data
  const officeLocation: OfficeLocation | null = currentLocation ? {
    id: 'kantor',
    name: 'Kantor',
    address: 'PT. INDOBUZZ REPUBLIK DIGITAL',
    coordinates: OFFICE_COORDINATES,
    distance: distanceFromOffice,
    isInRange: isWithinOfficeRange,
  } : null;

  // Handle location permission errors
  useEffect(() => {
    if (locationError && locationError.includes('permission')) {
      setShowPermissionModal(true);
    }
  }, [locationError]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  };

  const handleLocationSelect = (locationId: string) => {
    if (officeLocation?.isInRange) {
      setSelectedLocation(locationId);
    }
  };

  const handleContinue = () => {
    if (!selectedLocation) {
      Alert.alert(
        'Location Required', 
        'Please select your work location to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!officeLocation?.isInRange) {
      Alert.alert(
        'Location Access Denied',
        `You must be within ${ACCEPTABLE_RADIUS}m of the office to clock in. Current distance: ${officeLocation?.distance}m`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Proceed to selfie step
    router.push('/clock-in/selfie');
  };

  const handleRetryLocation = () => {
    refreshLocation();
  };

  const handleOpenSettings = () => {
    setShowPermissionModal(false);
    Linking.openSettings();
  };

  const getLocationStatusColor = () => {
    if (!officeLocation) return '#9E9E9E';
    return officeLocation.isInRange ? '#4CAF50' : '#F44336';
  };

  const getLocationStatusText = () => {
    if (!officeLocation) return 'Checking...';
    return officeLocation.isInRange ? 'Within Range' : 'Too Far';
  };

  const getProximityMessage = () => {
    if (!officeLocation) return 'Checking your location...';
    
    if (officeLocation.isInRange) {
      return `Great! You're ${officeLocation.distance}m from the office. You can proceed with clock in.`;
    } else {
      return `You're ${officeLocation.distance}m from the office. You need to be within ${ACCEPTABLE_RADIUS}m to clock in.`;
    }
  };

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
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={styles.connectionStatus}>
            {isOnline ? (
              <Wifi size={20} color="rgba(255, 255, 255, 0.8)" />
            ) : (
              <WifiOff size={20} color="#FF6B6B" />
            )}
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 2</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Location Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Navigation size={20} color="#4A90E2" />
            <Text style={styles.statusTitle}>Your Location Status</Text>
            {!isLoadingLocation && (
              <TouchableOpacity onPress={handleRetryLocation} style={styles.refreshButton}>
                <RefreshCw size={16} color="#4A90E2" />
              </TouchableOpacity>
            )}
          </View>
          
          {isLoadingLocation ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <AlertTriangle size={20} color="#F44336" />
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetryLocation}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : currentLocation ? (
            <View style={styles.locationStatusContainer}>
              <View style={styles.proximityIndicator}>
                <View style={[
                  styles.proximityDot,
                  { backgroundColor: getLocationStatusColor() }
                ]} />
                <Text style={[
                  styles.proximityStatus,
                  { color: getLocationStatusColor() }
                ]}>
                  {getLocationStatusText()}
                </Text>
              </View>
              <Text style={styles.proximityMessage}>
                {getProximityMessage()}
              </Text>
              {officeLocation && (
                <Text style={styles.coordinatesText}>
                  Distance: {officeLocation.distance}m from office
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.statusError}>
              Unable to detect location • Please enable GPS
            </Text>
          )}
        </View>

        {/* Instructions */}
        <View style={[
          styles.instructionsCard,
          !officeLocation?.isInRange && styles.warningCard
        ]}>
          <View style={styles.instructionsHeader}>
            {officeLocation?.isInRange ? (
              <CheckCircle size={20} color="#4CAF50" />
            ) : (
              <AlertTriangle size={20} color="#F44336" />
            )}
            <Text style={[
              styles.instructionsTitle,
              { color: officeLocation?.isInRange ? '#2E7D32' : '#D32F2F' }
            ]}>
              {officeLocation?.isInRange ? 'Location Verified' : 'Location Required'}
            </Text>
          </View>
          <Text style={[
            styles.instructionsText,
            { color: officeLocation?.isInRange ? '#2E7D32' : '#D32F2F' }
          ]}>
            {officeLocation?.isInRange 
              ? 'You are within the acceptable range of the office. You can now select the office location and proceed with clock in.'
              : `You must be within ${ACCEPTABLE_RADIUS} meters of PT. INDOBUZZ REPUBLIK DIGITAL office to clock in. Please move closer to the office location.`
            }
          </Text>
        </View>

        {/* Available Locations */}
        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Available Locations</Text>
          
          {!currentLocation || isLoadingLocation ? (
            <View style={styles.noLocationsContainer}>
              <Loader size={32} color="#E0E0E0" />
              <Text style={styles.noLocationsText}>Checking your location...</Text>
              <Text style={styles.noLocationsSubtext}>Please wait while we verify your proximity to the office</Text>
            </View>
          ) : !officeLocation?.isInRange ? (
            <View style={styles.noLocationsContainer}>
              <MapPinOff size={32} color="#E0E0E0" />
              <Text style={styles.noLocationsText}>No locations available</Text>
              <Text style={styles.noLocationsSubtext}>
                You must be within {ACCEPTABLE_RADIUS}m of the office to see available locations
              </Text>
              {officeLocation && (
                <Text style={styles.distanceInfo}>
                  Current distance: {officeLocation.distance}m
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.locationCard,
                selectedLocation === 'kantor' && styles.selectedLocationCard
              ]}
              onPress={() => handleLocationSelect('kantor')}
              activeOpacity={0.7}
            >
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <MapPin size={20} color="#4A90E2" />
                </View>
                
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>Kantor</Text>
                  <Text style={styles.locationAddress}>PT. INDOBUZZ REPUBLIK DIGITAL</Text>
                  
                  <View style={styles.distanceContainer}>
                    <Text style={styles.distanceText}>
                      {officeLocation.distance}m away
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: '#4CAF50' }
                    ]}>
                      <Text style={styles.statusBadgeText}>In Range</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.selectionIndicator}>
                  {selectedLocation === 'kantor' ? (
                    <CheckCircle size={24} color="#4A90E2" />
                  ) : (
                    <View style={styles.unselectedCircle} />
                  )}
                </View>
              </View>

              <View style={styles.inRangeIndicator}>
                <CheckCircle size={16} color="#4CAF50" />
                <Text style={styles.inRangeText}>You're within the office area</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Office Information */}
        <View style={styles.officeInfoCard}>
          <View style={styles.officeInfoHeader}>
            <MapPin size={20} color="#666" />
            <Text style={styles.officeInfoTitle}>Office Information</Text>
          </View>
          <Text style={styles.officeInfoText}>
            <Text style={styles.officeInfoLabel}>Name: </Text>
            PT. INDOBUZZ REPUBLIK DIGITAL
          </Text>
          <Text style={styles.officeInfoText}>
            <Text style={styles.officeInfoLabel}>Required Range: </Text>
            Within {ACCEPTABLE_RADIUS} meters
          </Text>
          <Text style={styles.officeInfoText}>
            <Text style={styles.officeInfoLabel}>Location: </Text>
            {OFFICE_COORDINATES.latitude.toFixed(6)}, {OFFICE_COORDINATES.longitude.toFixed(6)}
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedLocation || !officeLocation?.isInRange) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedLocation || !officeLocation?.isInRange}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedLocation && officeLocation?.isInRange 
                ? ['#4A90E2', '#357ABD'] 
                : ['#E0E0E0', '#BDBDBD']
            }
            style={styles.continueButtonGradient}
          >
            <Text style={[
              styles.continueButtonText,
              (!selectedLocation || !officeLocation?.isInRange) && styles.disabledButtonText
            ]}>
              {!officeLocation?.isInRange 
                ? `Move ${officeLocation ? officeLocation.distance - ACCEPTABLE_RADIUS : '?'}m Closer`
                : 'Continue to Selfie'
              }
            </Text>
            {selectedLocation && officeLocation?.isInRange && (
              <ChevronRight size={20} color="white" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRetry={() => {
          setShowPermissionModal(false);
          handleRetryLocation();
        }}
        onOpenSettings={handleOpenSettings}
      />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionStatus: {
    width: 40,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  locationStatusContainer: {
    gap: 8,
  },
  proximityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proximityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  proximityStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  proximityMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999',
  },
  statusError: {
    fontSize: 14,
    color: '#F44336',
  },
  instructionsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  warningCard: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  locationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  noLocationsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  noLocationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noLocationsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  distanceInfo: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedLocationCard: {
    borderColor: '#4A90E2',
    backgroundColor: '#F8FCFF',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  inRangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inRangeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
  officeInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  officeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  officeInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  officeInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  officeInfoLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  disabledButtonText: {
    color: '#999',
  },
});