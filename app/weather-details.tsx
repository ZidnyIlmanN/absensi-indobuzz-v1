import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, RefreshCw, Settings } from 'lucide-react-native';
import { DetailedWeatherCard } from '@/components/DetailedWeatherCard';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { useWeather } from '@/hooks/useWeather';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function WeatherDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {
    weatherData,
    selectedLocation,
    useCurrentLocation,
    isLoading,
    error,
    lastUpdated,
    refreshWeather,
    selectLocation,
    useCurrentLocationWeather,
    availableCities,
  } = useWeather({
    autoRefresh: true,
    refreshInterval: 15,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just updated';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
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
          <Text style={styles.headerTitle}>Weather Details</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        <View style={styles.locationHeader}>
          <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.locationHeaderText}>
            {useCurrentLocation ? 'Current Location' : 'Selected Location'}
          </Text>
          {lastUpdated && (
            <Text style={styles.lastUpdatedHeader}>
              • {formatLastUpdated()}
            </Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Weather Display Component */}
        <View style={styles.weatherDisplayContainer}>
          <WeatherDisplay 
            showDetailedInfo={true}
            autoRefreshInterval={15}
          />
        </View>

        {/* Detailed Weather Card */}
        {weatherData && (
          <DetailedWeatherCard
            weatherData={weatherData}
            onRefresh={() => refreshWeather()}
            isRefreshing={isLoading}
          />
        )}

        {/* Loading State */}
        {isLoading && !weatherData && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner text="Loading weather data..." />
          </View>
        )}

        {/* Error State */}
        {error && !weatherData && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refreshWeather()}>
              <RefreshCw size={16} color="#4A90E2" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Location Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Locations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickLocationsContainer}>
              <TouchableOpacity
                style={[
                  styles.quickLocationCard,
                  useCurrentLocation && styles.selectedQuickLocation
                ]}
                onPress={useCurrentLocationWeather}
              >
                <MapPin size={20} color={useCurrentLocation ? "#4A90E2" : "#666"} />
                <Text style={[
                  styles.quickLocationText,
                  useCurrentLocation && styles.selectedQuickLocationText
                ]}>
                  Current
                </Text>
              </TouchableOpacity>

              {availableCities.slice(0, 6).map((city) => (
                <TouchableOpacity
                  key={city.name}
                  style={[
                    styles.quickLocationCard,
                    !useCurrentLocation && selectedLocation?.name === city.name && styles.selectedQuickLocation
                  ]}
                  onPress={() => selectLocation(city)}
                >
                  <Text style={[
                    styles.quickLocationText,
                    !useCurrentLocation && selectedLocation?.name === city.name && styles.selectedQuickLocationText
                  ]}>
                    {city.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Weather Tips */}
        {weatherData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weather Tips</Text>
            <View style={styles.tipsCard}>
              {weatherData.temperature > 30 && (
                <Text style={styles.tipText}>🌡️ It's quite hot today. Stay hydrated and avoid prolonged sun exposure.</Text>
              )}
              {weatherData.humidity > 80 && (
                <Text style={styles.tipText}>💧 High humidity today. You might feel warmer than the actual temperature.</Text>
              )}
              {weatherData.description.includes('rain') && (
                <Text style={styles.tipText}>☔ Rain expected. Don't forget to bring an umbrella!</Text>
              )}
              {weatherData.windSpeed > 10 && (
                <Text style={styles.tipText}>💨 Windy conditions. Secure loose items when outdoors.</Text>
              )}
              {weatherData.temperature < 20 && (
                <Text style={styles.tipText}>🧥 Cooler weather today. Consider wearing a light jacket.</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationHeaderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  lastUpdatedHeader: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weatherDisplayContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  quickLocationsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedQuickLocation: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  quickLocationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  selectedQuickLocationText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});