import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentLocation, checkOfficeProximity, LocationCoordinates } from '@/utils/location';

interface LocationState {
  currentLocation: LocationCoordinates | null;
  isWithinOfficeRange: boolean;
  distanceFromOffice: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
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
      const location = await getCurrentLocation();
      
      if (location) {
        const proximityCheck = checkOfficeProximity(location);
        
        const newState: LocationState = {
          currentLocation: location,
          isWithinOfficeRange: proximityCheck.isWithinRange,
          distanceFromOffice: proximityCheck.distance,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        };

        setLocationState(newState);

        // Trigger callbacks
        callbacksRef.current.onLocationChange?.(location);
        callbacksRef.current.onProximityChange?.(proximityCheck.isWithinRange, proximityCheck.distance);

        return newState;
      } else {
        throw new Error('Unable to get location');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location access failed';
      
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
    let interval: NodeJS.Timeout | null = null;
    
    if (enableRealTimeTracking) {
      interval = setInterval(() => {
        updateLocation(true); // Silent updates for real-time tracking
      }, trackingInterval);
    }

    return () => {
      if (interval) {
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