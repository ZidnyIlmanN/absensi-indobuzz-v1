import { useState, useEffect, useCallback, useRef } from 'react';
import { getHighAccuracyLocation, checkOfficeProximityDetailed, LocationCoordinates } from '@/utils/location';

interface LocationState {
  currentLocation: LocationCoordinates | null;
  isWithinOfficeRange: boolean;
  distanceFromOffice: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  accuracy?: number;
}

interface UseLocationTrackingOptions {
  enableRealTimeTracking?: boolean;
  trackingInterval?: number; // in milliseconds
  onLocationChange?: (location: LocationCoordinates) => void;
  onProximityChange?: (isWithinRange: boolean, distance: number) => void;
}

export function useLocationTracking(options: UseLocationTrackingOptions = {}) {
  const {
    enableRealTimeTracking = false,
    trackingInterval = 5000,
    onLocationChange,
    onProximityChange,
  } = options;

  const [locationState, setLocationState] = useState<LocationState>({
    currentLocation: null,
    isWithinOfficeRange: false,
    distanceFromOffice: 0,
    isLoading: true,
    error: null,
    lastUpdated: null,
    accuracy: undefined,
  });

  // Use refs to store callback functions to prevent dependency changes
  const callbacksRef = useRef({ onLocationChange, onProximityChange });
  
  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = { onLocationChange, onProximityChange };
  }, [onLocationChange, onProximityChange]);

  const updateLocation = useCallback(async (silent = false) => {
    if (!silent) {
      setLocationState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      console.log('Updating location...');
      const result = await checkOfficeProximityDetailed(true);
      
      if (result.currentLocation && !result.error) {
        const location = result.currentLocation;
        
        // Validate coordinates to avoid invalid location data
        if (
          location.latitude === 0 && location.longitude === 0 ||
          location.latitude > 90 || location.latitude < -90 ||
          location.longitude > 180 || location.longitude < -180
        ) {
          throw new Error('Invalid GPS coordinates received');
        }

        const newState: LocationState = {
          currentLocation: location,
          isWithinOfficeRange: result.isWithinRange,
          distanceFromOffice: result.distance,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          accuracy: result.accuracy,
        };

        setLocationState(newState);

        // Trigger callbacks
        callbacksRef.current.onLocationChange?.(location);
        callbacksRef.current.onProximityChange?.(result.isWithinRange, result.distance);

        console.log(`Location updated: ${result.isWithinRange ? 'Within range' : 'Too far'} (${result.distance}m)`);
        return newState;
      } else {
        throw new Error(result.error || 'Unable to get location');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location access failed';
      console.error('Location update failed:', errorMessage);
      
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return null;
    }
  }, []); // Remove dependencies to prevent infinite re-renders

  const requestLocationUpdate = useCallback(() => {
    return updateLocation(false);
  }, [updateLocation]);

  useEffect(() => {
    // Initial location fetch
    updateLocation(false);

    // Set up real-time tracking if enabled
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (enableRealTimeTracking) {
      console.log(`Starting real-time location tracking (${trackingInterval}ms interval)`);
      interval = setInterval(() => {
        updateLocation(true); // Silent updates for real-time tracking
      }, trackingInterval);
    }

    return () => {
      if (interval) {
        console.log('Stopping real-time location tracking');
        clearInterval(interval);
      }
    };
  }, [enableRealTimeTracking, trackingInterval]); // Remove updateLocation dependency

  return {
    ...locationState,
    requestLocationUpdate,
    refreshLocation: () => updateLocation(false),
  };
}
