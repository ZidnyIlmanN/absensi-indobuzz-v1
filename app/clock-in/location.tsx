import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
} from 'lucide-react-native';
import { getCurrentLocation, WORK_LOCATIONS, calculateDistance } from '@/utils/location';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface WorkLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  distance?: number;
  isInRange?: boolean;
}

export default function LocationSelectionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locations, setLocations] = useState<WorkLocation[]>(WORK_LOCATIONS);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        
        // Calculate distances to work locations
        const updatedLocations = WORK_LOCATIONS.map(workLocation => {
          const distance = calculateDistance(location, workLocation.coordinates);
          const isInRange = distance <= workLocation.radius;
          
          return {
            ...workLocation,
            distance: Math.round(distance),
            isInRange,
          };
        });

        // Sort by distance
        updatedLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setLocations(updatedLocations);

        // Auto-select if user is within range of a location
        const inRangeLocation = updatedLocations.find(loc => loc.isInRange);
        if (inRangeLocation) {
          setSelectedLocation(inRangeLocation.id);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please select your work location manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const handleContinue = () => {
    if (!selectedLocation) {
      Alert.alert('Location Required', 'Please select your work location to continue.');
      return;
    }

    const location = locations.find(loc => loc.id === selectedLocation);
    if (location && !location.isInRange) {
      Alert.alert(
        'Location Warning',
        `You are ${location.distance}m away from ${location.name}. Are you sure you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => router.push('/clock-in/selfie')
          }
        ]
      );
    } else {
      router.push('/clock-in/selfie');
    }
  };

  const getLocationStatusColor = (location: WorkLocation) => {
    if (location.isInRange) return '#4CAF50';
    if ((location.distance || 0) <= 500) return '#FF9800';
    return '#F44336';
  };

  const getLocationStatusText = (location: WorkLocation) => {
    if (location.isInRange) return 'In Range';
    if ((location.distance || 0) <= 500) return 'Nearby';
    return 'Far';
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Location Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Navigation size={20} color="#4A90E2" />
            <Text style={styles.statusTitle}>Your Location</Text>
          </View>
          
          {isLoadingLocation ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : currentLocation ? (
            <Text style={styles.statusText}>
              Location detected • GPS accuracy: High
            </Text>
          ) : (
            <Text style={styles.statusError}>
              Unable to detect location • Please enable GPS
            </Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Choose Your Work Location</Text>
          <Text style={styles.instructionsText}>
            Select the location where you'll be working today. We'll verify you're within the designated area.
          </Text>
        </View>

        {/* Location List */}
        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Available Locations</Text>
          
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                selectedLocation === location.id && styles.selectedLocationCard
              ]}
              onPress={() => handleLocationSelect(location.id)}
              activeOpacity={0.7}
            >
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <MapPin size={20} color="#4A90E2" />
                </View>
                
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  
                  {location.distance !== undefined && (
                    <View style={styles.distanceContainer}>
                      <Text style={styles.distanceText}>
                        {location.distance}m away
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getLocationStatusColor(location) }
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {getLocationStatusText(location)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={styles.selectionIndicator}>
                  {selectedLocation === location.id ? (
                    <CheckCircle size={24} color="#4A90E2" />
                  ) : (
                    <View style={styles.unselectedCircle} />
                  )}
                </View>
              </View>

              {location.isInRange && (
                <View style={styles.inRangeIndicator}>
                  <CheckCircle size={16} color="#4CAF50" />
                  <Text style={styles.inRangeText}>You're within the work area</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual Location Option */}
        <TouchableOpacity style={styles.manualLocationCard}>
          <View style={styles.manualLocationContent}>
            <MapPin size={20} color="#666" />
            <View style={styles.manualLocationInfo}>
              <Text style={styles.manualLocationTitle}>Can't find your location?</Text>
              <Text style={styles.manualLocationText}>Contact your supervisor for assistance</Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedLocation && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedLocation ? ['#4A90E2', '#357ABD'] : ['#E0E0E0', '#BDBDBD']}
            style={styles.continueButtonGradient}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedLocation && styles.disabledButtonText
            ]}>
              Continue to Selfie
            </Text>
            <ChevronRight size={20} color={selectedLocation ? 'white' : '#999'} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
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
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  statusError: {
    fontSize: 14,
    color: '#F44336',
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1565C0',
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
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginTop: 12,
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
  manualLocationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  manualLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualLocationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  manualLocationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  manualLocationText: {
    fontSize: 12,
    color: '#999',
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