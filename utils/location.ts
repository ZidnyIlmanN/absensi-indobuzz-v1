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
      latitude: -6.200000,
      longitude: 106.816666,
    },
    radius: 50, // 50 meters acceptable radius
  },
];

// Office coordinates from Google Maps link
export const OFFICE_COORDINATES = {
  latitude: -6.200000,
  longitude: 106.816666,
};

export const ACCEPTABLE_RADIUS = 50; // meters

export const checkOfficeProximity = (
  currentLocation: LocationCoordinates
): { isWithinRange: boolean; distance: number } => {
  const distance = calculateDistance(currentLocation, OFFICE_COORDINATES);
  return {
    isWithinRange: distance <= ACCEPTABLE_RADIUS,
    distance: Math.round(distance),
  };
};