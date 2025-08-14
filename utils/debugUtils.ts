/**
 * Debug utilities for troubleshooting navigation and map issues
 */

import WebView from "react-native-webview";

export interface NavigationDebugInfo {
  currentRoute: string;
  segments: string[];
  isAuthenticated: boolean;
  hasRedirected: boolean;
  routeFlags: { [key: string]: boolean };
}

export interface MapDebugInfo {
  platform: string;
  isWebViewAvailable: boolean;
  isLeafletLoaded: boolean;
  hasLocationPermission: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  markersCount: number;
  mapReady: boolean;
}

/**
 * Debug navigation routing issues
 */
export function debugNavigation(
  segments: string[],
  isAuthenticated: boolean,
  hasRedirected: boolean
): NavigationDebugInfo {
  const currentRoute = segments.join('/') || 'root';
  
  const routeFlags = {
    inTabsGroup: segments[0] === '(tabs)',
    inAuthGroup: segments[0] === '(auth)',
    isLiveTrackingRoute: segments[0] === 'live-tracking' || segments[0] === 'live-tracking-protected',
    isLiveAttendanceProtected: segments[0] === 'live-attendance-protected',
    isClockInRoute: segments[0] === 'clock-in',
    isAllFeaturesRoute: segments[0] === 'lihat-semua',
  };

  const debugInfo: NavigationDebugInfo = {
    currentRoute,
    segments,
    isAuthenticated,
    hasRedirected,
    routeFlags,
  };

  console.log('=== NAVIGATION DEBUG ===');
  console.log('Current route:', currentRoute);
  console.log('Segments:', segments);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Has redirected:', hasRedirected);
  console.log('Route flags:', routeFlags);
  console.log('========================');

  return debugInfo;
}

/**
 * Debug map loading and functionality
 */
export function debugMap(
  platform: string,
  currentLocation: { latitude: number; longitude: number } | null,
  markers: any[],
  mapReady: boolean
): MapDebugInfo {
  const isWebViewAvailable = typeof WebView !== 'undefined';
  const isLeafletLoaded = typeof window !== 'undefined' && !!(window as any).L;
  
  const debugInfo: MapDebugInfo = {
    platform,
    isWebViewAvailable,
    isLeafletLoaded,
    hasLocationPermission: !!currentLocation,
    currentLocation,
    markersCount: markers.length,
    mapReady,
  };

  console.log('=== MAP DEBUG ===');
  console.log('Platform:', platform);
  console.log('WebView available:', isWebViewAvailable);
  console.log('Leaflet loaded:', isLeafletLoaded);
  console.log('Has location permission:', !!currentLocation);
  console.log('Current location:', currentLocation);
  console.log('Markers count:', markers.length);
  console.log('Map ready:', mapReady);
  console.log('=================');

  return debugInfo;
}

/**
 * Test route accessibility
 */
export async function testRouteAccessibility(routePath: string): Promise<{
  accessible: boolean;
  error?: string;
  suggestions: string[];
}> {
  const suggestions: string[] = [];
  
  try {
    // Check if route file exists (this is a simplified check)
    const routeExists = true; // In a real implementation, you'd check the file system
    
    if (!routeExists) {
      suggestions.push('Create the route file');
      suggestions.push('Check file naming convention');
      return { accessible: false, error: 'Route file not found', suggestions };
    }

    // Check authentication requirements
    if (routePath.includes('protected')) {
      suggestions.push('Ensure user is authenticated');
      suggestions.push('Check AuthGuard implementation');
    }

    // Check for common issues
    suggestions.push('Verify component export');
    suggestions.push('Check import statements');
    suggestions.push('Validate route registration');

    return { accessible: true, suggestions };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: ['Check console for detailed errors', 'Verify route configuration'],
    };
  }
}

/**
 * Performance monitoring for map operations
 */
export class MapPerformanceMonitor {
  private static instance: MapPerformanceMonitor;
  private metrics: { [key: string]: number[] } = {};

  public static getInstance(): MapPerformanceMonitor {
    if (!MapPerformanceMonitor.instance) {
      MapPerformanceMonitor.instance = new MapPerformanceMonitor();
    }
    return MapPerformanceMonitor.instance;
  }

  startTiming(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics[operation]) {
        this.metrics[operation] = [];
      }
      
      this.metrics[operation].push(duration);
      
      // Keep only last 10 measurements
      if (this.metrics[operation].length > 10) {
        this.metrics[operation] = this.metrics[operation].slice(-10);
      }
      
      console.log(`Map operation "${operation}" took ${duration.toFixed(2)}ms`);
    };
  }

  getAverageTime(operation: string): number {
    const times = this.metrics[operation];
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): { [key: string]: { average: number; count: number; latest: number } } {
    const result: { [key: string]: { average: number; count: number; latest: number } } = {};
    
    Object.keys(this.metrics).forEach(operation => {
      const times = this.metrics[operation];
      result[operation] = {
        average: this.getAverageTime(operation),
        count: times.length,
        latest: times[times.length - 1] || 0,
      };
    });
    
    return result;
  }

  logPerformanceReport(): void {
    console.log('=== MAP PERFORMANCE REPORT ===');
    const metrics = this.getMetrics();
    
    Object.keys(metrics).forEach(operation => {
      const metric = metrics[operation];
      console.log(`${operation}:`, {
        average: `${metric.average.toFixed(2)}ms`,
        count: metric.count,
        latest: `${metric.latest.toFixed(2)}ms`,
      });
    });
    
    console.log('==============================');
  }
}

/**
 * Map error recovery utilities
 */
export class MapErrorRecovery {
  private static retryCount = 0;
  private static maxRetries = 3;

  static async attemptMapRecovery(
    error: any,
    retryCallback: () => Promise<void>
  ): Promise<{ success: boolean; error?: string }> {
    console.error('Map error occurred:', error);
    
    if (this.retryCount >= this.maxRetries) {
      return {
        success: false,
        error: `Map failed to load after ${this.maxRetries} attempts`,
      };
    }

    this.retryCount++;
    console.log(`Attempting map recovery (${this.retryCount}/${this.maxRetries})`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount)); // Exponential backoff
      await retryCallback();
      
      this.retryCount = 0; // Reset on success
      return { success: true };
    } catch (retryError) {
      return this.attemptMapRecovery(retryError, retryCallback);
    }
  }

  static resetRetryCount(): void {
    this.retryCount = 0;
  }
}