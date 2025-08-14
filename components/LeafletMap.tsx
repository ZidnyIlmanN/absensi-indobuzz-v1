import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  color: string;
  type: 'office' | 'employee';
  employee?: any;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapReady?: () => void;
  showUserLocation?: boolean;
  userLocation?: [number, number];
  style?: any;
}

export interface LeafletMapRef {
  setView: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [number, number][], options?: { padding?: [number, number] }) => void;
  addMarker: (marker: MapMarker) => void;
  removeMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<MapMarker>) => void;
}

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapReady,
  showUserLocation = false,
  userLocation,
  style,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useImperativeHandle(ref, () => ({
    setView: (newCenter: [number, number], newZoom?: number) => {
      if (isMapReady && webViewRef.current && Platform.OS !== 'web') {
        const message = JSON.stringify({
          type: 'setView',
          center: newCenter,
          zoom: newZoom || zoom,
        });
        webViewRef.current.postMessage(message);
      }
    },
    fitBounds: (bounds: [number, number][], options?: { padding?: [number, number] }) => {
      if (isMapReady && webViewRef.current && Platform.OS !== 'web') {
        const message = JSON.stringify({
          type: 'fitBounds',
          bounds,
          options,
        });
        webViewRef.current.postMessage(message);
      }
    },
    addMarker: (marker: MapMarker) => {
      if (isMapReady && webViewRef.current && Platform.OS !== 'web') {
        const message = JSON.stringify({
          type: 'addMarker',
          marker,
        });
        webViewRef.current.postMessage(message);
      }
    },
    removeMarker: (markerId: string) => {
      if (isMapReady && webViewRef.current && Platform.OS !== 'web') {
        const message = JSON.stringify({
          type: 'removeMarker',
          markerId,
        });
        webViewRef.current.postMessage(message);
      }
    },
    updateMarker: (markerId: string, updates: Partial<MapMarker>) => {
      if (isMapReady && webViewRef.current && Platform.OS !== 'web') {
        const message = JSON.stringify({
          type: 'updateMarker',
          markerId,
          updates,
        });
        webViewRef.current.postMessage(message);
      }
    },
  }));

  // Update markers when they change
  useEffect(() => {
    if (isMapReady && webViewRef.current && Platform.OS !== 'web') {
      const message = JSON.stringify({
        type: 'updateMarkers',
        markers,
      });
      webViewRef.current.postMessage(message);
    }
  }, [markers, isMapReady]);

  // Update user location when it changes
  useEffect(() => {
    if (isMapReady && webViewRef.current && showUserLocation && userLocation && Platform.OS !== 'web') {
      const message = JSON.stringify({
        type: 'updateUserLocation',
        location: userLocation,
      });
      webViewRef.current.postMessage(message);
    }
  }, [userLocation, showUserLocation, isMapReady]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapReady':
          setIsMapReady(true);
          onMapReady?.();
          break;
        case 'markerClick':
          const marker = markers.find(m => m.id === data.markerId);
          if (marker && onMarkerClick) {
            onMarkerClick(marker);
          }
          break;
        default:
          console.log('Unknown message from map:', data);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Live Tracking Map</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .custom-marker {
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .office-marker {
          background-color: #2196F3;
          width: 20px;
          height: 20px;
        }
        .employee-marker {
          width: 16px;
          height: 16px;
        }
        .user-location {
          background-color: #4A90E2;
          width: 12px;
          height: 12px;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map;
        let markersLayer;
        let userLocationMarker;
        
        // Error handling wrapper
        function safeExecute(fn, errorMessage) {
          try {
            return fn();
          } catch (error) {
            console.error(errorMessage, error);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: errorMessage,
                error: error.message
              }));
            }
            return null;
          }
        }
        
        // Initialize map
        function initMap() {
          safeExecute(() => {
            map = L.map('map', {
              zoomControl: true,
              attributionControl: false,
            }).setView([${center[0]}, ${center[1]}], ${zoom});
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Create markers layer
            markersLayer = L.layerGroup().addTo(map);
            
            // Notify React Native that map is ready
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady'
              }));
            }
          }, 'Failed to initialize map');
        }
        
        // Handle messages from React Native
        window.addEventListener('message', function(event) {
          safeExecute(() => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
              case 'setView':
                if (map) {
                  map.setView(data.center, data.zoom);
                }
                break;
                
              case 'fitBounds':
                if (map && data.bounds && data.bounds.length > 0) {
                  const bounds = L.latLngBounds(data.bounds);
                  map.fitBounds(bounds, data.options || {});
                }
                break;
                
              case 'updateMarkers':
                updateMarkers(data.markers);
                break;
                
              case 'updateUserLocation':
                updateUserLocation(data.location);
                break;
                
              case 'addMarker':
                addMarker(data.marker);
                break;
                
              case 'removeMarker':
                removeMarker(data.markerId);
                break;
                
              case 'updateMarker':
                updateMarker(data.markerId, data.updates);
                break;
            }
          }, 'Failed to handle message from React Native');
        });
        
        function updateMarkers(newMarkers) {
          safeExecute(() => {
            if (!markersLayer) return;
            
            // Clear existing markers
            markersLayer.clearLayers();
            
            // Add new markers
            newMarkers.forEach(marker => {
              addMarkerToLayer(marker);
            });
          }, 'Failed to update markers');
        }
        
        function addMarkerToLayer(marker) {
          safeExecute(() => {
            if (!markersLayer) return;
            
            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker ' + (marker.type === 'office' ? 'office-marker' : 'employee-marker');
            markerElement.style.backgroundColor = marker.color;
            
            const customIcon = L.divIcon({
              className: '',
              html: markerElement.outerHTML,
              iconSize: marker.type === 'office' ? [20, 20] : [16, 16],
              iconAnchor: marker.type === 'office' ? [10, 10] : [8, 8],
            });
            
            const leafletMarker = L.marker(marker.position, { icon: customIcon })
              .bindPopup('<b>' + marker.title + '</b><br>' + (marker.description || ''))
              .on('click', function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerClick',
                    markerId: marker.id
                  }));
                }
              });
            
            markersLayer.addLayer(leafletMarker);
          }, 'Failed to add marker to layer');
        }
        
        function updateUserLocation(location) {
          safeExecute(() => {
            if (!map) return;
            
            if (userLocationMarker) {
              map.removeLayer(userLocationMarker);
            }
            
            const userIcon = L.divIcon({
              className: '',
              html: '<div class="user-location"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });
            
            userLocationMarker = L.marker(location, { icon: userIcon })
              .bindPopup('Your Location')
              .addTo(map);
          }, 'Failed to update user location');
        }
        
        function addMarker(marker) {
          addMarkerToLayer(marker);
        }
        
        function removeMarker(markerId) {
          // Implementation for removing specific marker
          // This would require tracking markers by ID
        }
        
        function updateMarker(markerId, updates) {
          // Implementation for updating specific marker
          // This would require tracking markers by ID
        }
        
        // Initialize when DOM is ready with error handling
        document.addEventListener('DOMContentLoaded', function() {
          safeExecute(initMap, 'Failed to initialize map on DOM ready');
        });
        
        // Fallback initialization with error handling
        if (document.readyState === 'complete') {
          safeExecute(initMap, 'Failed to initialize map on fallback');
        }
      </script>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    // For web platform, return a simple placeholder
    return (
      <View style={[styles.container, style]}>
        <View style={styles.webPlaceholder}>
          <Text style={styles.webPlaceholderText}>
            Map not available on web platform
          </Text>
        </View>
      </View>
    );
  }

  // For mobile platforms, use WebView
  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => console.log('WebView loading ended')}
        onError={(error) => {
          console.error('WebView error:', error);
        }}
        onHttpError={(error) => {
          console.error('WebView HTTP error:', error);
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Allow all requests for now
          return true;
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  webPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});