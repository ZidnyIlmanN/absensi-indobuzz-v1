import { Platform } from 'react-native';

export interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  color: string;
  type: 'office' | 'employee';
  employee?: any;
}

export interface MapBounds {
  northeast: [number, number];
  southwest: [number, number];
}

/**
 * Calculate bounds for a set of coordinates
 */
export function calculateBounds(coordinates: [number, number][]): MapBounds {
  if (coordinates.length === 0) {
    return {
      northeast: [0, 0],
      southwest: [0, 0],
    };
  }

  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];

  coordinates.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  return {
    northeast: [maxLat, maxLng],
    southwest: [minLat, minLng],
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1[0] * Math.PI) / 180;
  const φ2 = (point2[0] * Math.PI) / 180;
  const Δφ = ((point2[0] - point1[0]) * Math.PI) / 180;
  const Δλ = ((point2[1] - point1[1]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: [number, number]): string {
  return `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`;
}

/**
 * Check if map libraries are available
 */
export function isMapLibraryAvailable(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && !!window.L;
  }
  return true; // Assume available on native platforms
}

/**
 * Get optimal zoom level for a set of coordinates
 */
export function getOptimalZoom(coordinates: [number, number][], containerSize: { width: number; height: number }): number {
  if (coordinates.length <= 1) {
    return 15; // Default zoom for single point
  }

  const bounds = calculateBounds(coordinates);
  const latDiff = bounds.northeast[0] - bounds.southwest[0];
  const lngDiff = bounds.northeast[1] - bounds.southwest[1];
  
  // Simple zoom calculation based on coordinate span
  const maxDiff = Math.max(latDiff, lngDiff);
  
  if (maxDiff > 1) return 8;
  if (maxDiff > 0.5) return 10;
  if (maxDiff > 0.1) return 12;
  if (maxDiff > 0.05) return 14;
  return 16;
}

/**
 * Validate coordinates
 */
export function validateCoordinates(coordinates: [number, number]): boolean {
  const [lat, lng] = coordinates;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

/**
 * Create marker data from employee information
 */
export function createEmployeeMarker(employee: any): MapMarker | null {
  if (!employee.liveLocation?.location) {
    return null;
  }

  const position: [number, number] = [
    employee.liveLocation.location.latitude,
    employee.liveLocation.location.longitude,
  ];

  if (!validateCoordinates(position)) {
    console.warn(`Invalid coordinates for employee ${employee.name}:`, position);
    return null;
  }

  return {
    id: `employee-${employee.id}`,
    position,
    title: employee.name,
    description: `${employee.position} • ${employee.status}`,
    color: getStatusColor(employee.status),
    type: 'employee',
    employee,
  };
}

/**
 * Create marker data from office location
 */
export function createOfficeMarker(office: any): MapMarker {
  return {
    id: `office-${office.id}`,
    position: [office.coordinates.latitude, office.coordinates.longitude],
    title: office.name,
    description: office.address,
    color: '#2196F3',
    type: 'office',
  };
}

/**
 * Get status color for employee markers
 */
export function getStatusColor(status: string): string {
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
}

/**
 * Map error handler
 */
export function handleMapError(error: any): string {
  console.error('Map error:', error);
  
  if (error.message?.includes('network')) {
    return 'Network error loading map. Please check your internet connection.';
  }
  
  if (error.message?.includes('permission')) {
    return 'Location permission required for map functionality.';
  }
  
  return 'Map failed to load. Please try refreshing the page.';
}

/**
 * Performance optimization for marker updates
 */
export function shouldUpdateMarkers(
  oldMarkers: MapMarker[],
  newMarkers: MapMarker[]
): boolean {
  if (oldMarkers.length !== newMarkers.length) {
    return true;
  }

  // Check if any marker positions have changed significantly
  for (let i = 0; i < oldMarkers.length; i++) {
    const oldMarker = oldMarkers[i];
    const newMarker = newMarkers.find(m => m.id === oldMarker.id);
    
    if (!newMarker) {
      return true; // Marker removed
    }

    const distance = calculateDistance(oldMarker.position, newMarker.position);
    if (distance > 10) { // 10 meters threshold
      return true;
    }
  }

  return false;
}