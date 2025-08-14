import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  color: string;
  type: 'office' | 'employee';
  employee?: any;
}

interface LeafletMapWebProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapReady?: () => void;
  showUserLocation?: boolean;
  userLocation?: [number, number];
  style?: any;
}

export interface LeafletMapWebRef {
  setView: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [number, number][], options?: { padding?: [number, number] }) => void;
}

export const LeafletMapWeb = forwardRef<LeafletMapWebRef, LeafletMapWebProps>(({
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapReady,
  showUserLocation = false,
  userLocation,
  style,
}, ref) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    setView: (newCenter: [number, number], newZoom?: number) => {
      if (mapInstance) {
        mapInstance.setView(newCenter, newZoom || zoom);
      }
    },
    fitBounds: (bounds: [number, number][], options?: { padding?: [number, number] }) => {
      if (mapInstance && bounds.length > 0) {
        const leafletBounds = (window as any).L.latLngBounds(bounds);
        mapInstance.fitBounds(leafletBounds, options || {});
      }
    },
  }));

  useEffect(() => {
    // Load Leaflet dynamically for web
    if (typeof window !== 'undefined' && !window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    } else if (window.L) {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (typeof window === 'undefined' || !window.L) return;

    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) return;

    const map = window.L.map('leaflet-map').setView(center, zoom);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    setMapInstance(map);
    setIsReady(true);
    onMapReady?.();
  };

  // Update markers when they change
  useEffect(() => {
    if (!mapInstance || !isReady) return;

    // Clear existing markers
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach(marker => {
      const leafletMarker = window.L.marker(marker.position)
        .addTo(mapInstance)
        .bindPopup(`<b>${marker.title}</b><br>${marker.description || ''}`)
        .on('click', () => {
          onMarkerClick?.(marker);
        });

      // Customize marker color
      const markerElement = leafletMarker.getElement();
      if (markerElement) {
        markerElement.style.filter = `hue-rotate(${getHueRotation(marker.color)}deg)`;
      }
    });

    // Add user location marker
    if (showUserLocation && userLocation) {
      window.L.circleMarker(userLocation, {
        color: '#4A90E2',
        fillColor: '#4A90E2',
        fillOpacity: 0.8,
        radius: 8,
      }).addTo(mapInstance).bindPopup('Your Location');
    }
  }, [mapInstance, markers, showUserLocation, userLocation, isReady]);

  const getHueRotation = (color: string): number => {
    // Convert hex color to hue rotation for marker styling
    const colorMap: { [key: string]: number } = {
      '#4CAF50': 120, // Green
      '#FF9800': 30,  // Orange
      '#F44336': 0,   // Red
      '#2196F3': 210, // Blue
    };
    return colorMap[color] || 0;
  };

  return (
    <View style={[styles.container, style]}>
      <div
        id="leaflet-map"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});