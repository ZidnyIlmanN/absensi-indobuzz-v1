import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

export const reverseGeocode = async (
  coordinates: LocationCoordinates
): Promise<string> => {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    
    if (address) {
      return `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
    }
    
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  }
};

export const calculateDistance = (
  point1: LocationCoordinates,
  point2: LocationCoordinates
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

export const isWithinGeofence = (
  currentLocation: LocationCoordinates,
  workLocation: LocationCoordinates,
  radius: number = 100 // Default radius of 100 meters
): boolean => {
  const distance = calculateDistance(currentLocation, workLocation);
  return distance <= radius;
};

export const formatCoordinates = (coordinates: LocationCoordinates): string => {
  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
};

// Mock work locations for demo purposes
export const WORK_LOCATIONS = [
  {
    id: '1',
    name: 'Kantor',
    address: 'PT. INDOBUZZ REPUBLIK DIGITAL',
    coordinates: {
      latitude: -6.562300216281189,
      longitude: 107.78160173799691,
    },
    radius: 100, // 100 meters acceptable radius for better coverage
  },
];

// Office coordinates from Google Maps link
export const OFFICE_COORDINATES = {
      latitude: -6.562300216281189,
      longitude: 107.78160173799691,
};

export const ACCEPTABLE_RADIUS = 100; // meters - increased for better user experience

export const checkOfficeProximity = (
  currentLocation: LocationCoordinates
): { isWithinRange: boolean; distance: number } => {
  const distance = calculateDistance(currentLocation, OFFICE_COORDINATES);
  return {
    isWithinRange: distance <= ACCEPTABLE_RADIUS,
    distance: Math.round(distance),
  };
};

// Function to get high accuracy location with retry mechanism
export const getHighAccuracyLocation = async (maxRetries: number = 3): Promise<LocationCoordinates | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      console.log(`Getting location - Attempt ${attempt}/${maxRetries}`);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 1000, // Use cached location if less than 1 second old
        timeout: 15000, // 15 second timeout
      } as any);

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log(`Location obtained: ${coords.latitude}, ${coords.longitude}`);
      console.log(`Accuracy: ${location.coords.accuracy}m`);

      // Check for suspiciously large coordinates or zero values
      if (
        coords.latitude === 0 && coords.longitude === 0 ||
        coords.latitude > 90 || coords.latitude < -90 ||
        coords.longitude > 180 || coords.longitude < -180
      ) {
        throw new Error('Invalid GPS coordinates received');
      }
      
      return coords;
    } catch (error) {
      console.error(`Location attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Last attempt failed, try with lower accuracy
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
            maximumAge: 1000,
            timeout: 15000,
          } as any);
          
          const fallbackCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          console.log(`Fallback location obtained: ${fallbackCoords.latitude}, ${fallbackCoords.longitude}`);
          return fallbackCoords;
        } catch (fallbackError) {
          console.error('Fallback location failed:', fallbackError);
          return null;
        }
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return null;
};

// Enhanced proximity check with debugging
export const checkOfficeProximityDetailed = async (
  forceRefresh: boolean = false
): Promise<{ 
  isWithinRange: boolean; 
  distance: number; 
  currentLocation: LocationCoordinates | null;
  accuracy?: number;
  error?: string;
}> => {
  try {
    const currentLocation = await getHighAccuracyLocation();
    
    if (!currentLocation) {
      return {
        isWithinRange: false,
        distance: 0,
        currentLocation: null,
        error: 'Unable to get current location'
      };
    }

    const distance = calculateDistance(currentLocation, OFFICE_COORDINATES);
    const isWithinRange = distance <= ACCEPTABLE_RADIUS;
    
    console.log('=== Location Check Details ===');
    console.log(`Current Location: ${currentLocation.latitude}, ${currentLocation.longitude}`);
    console.log(`Office Location: ${OFFICE_COORDINATES.latitude}, ${OFFICE_COORDINATES.longitude}`);
    console.log(`Distance: ${Math.round(distance)}m`);
    console.log(`Acceptable Radius: ${ACCEPTABLE_RADIUS}m`);
    console.log(`Within Range: ${isWithinRange}`);
    console.log('==============================');
    
    return {
      isWithinRange,
      distance: Math.round(distance),
      currentLocation,
      accuracy: undefined,
    };
  } catch (error) {
    console.error('Proximity check failed:', error);
    return {
      isWithinRange: false,
      distance: 0,
      currentLocation: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
