import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Zap,
  Eye,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  ChevronDown,
  RefreshCw,
  X,
  Navigation,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLocalizedDate } from '@/hooks/useI18n';
import { weatherService, WeatherData, LocationData, INDONESIAN_CITIES } from '@/services/weatherService';
import { getCurrentLocation } from '@/utils/location';
import { LoadingSpinner } from './LoadingSpinner';

interface WeatherDisplayProps {
  style?: any;
  showDetailedInfo?: boolean;
  autoRefreshInterval?: number; // in minutes
}

export function WeatherDisplay({ 
  style, 
  showDetailedInfo = true,
  autoRefreshInterval = 10 
}: WeatherDisplayProps) {
  const { t } = useTranslation();
  const { formatRelativeTime } = useLocalizedDate();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  // Initialize weather data
  useEffect(() => {
    initializeWeather();
  }, []);

  // Auto-refresh weather data
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        refreshWeather(true); // Silent refresh
      }, autoRefreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, selectedLocation, useCurrentLocation]);

  const initializeWeather = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useCurrentLocation) {
        await loadWeatherByCurrentLocation();
      } else {
        // Default to Jakarta if no location selected
        const defaultCity = INDONESIAN_CITIES[0];
        setSelectedLocation(defaultCity);
        await loadWeatherByCity(defaultCity.name);
      }
    } catch (error) {
      console.error('Weather initialization error:', error);
      setError('Failed to initialize weather data');
      // Fallback to mock data
      setWeatherData(weatherService.getMockWeatherData('Jakarta'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeatherByCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      
      if (!location) {
        throw new Error('Unable to get current location');
      }

      const { weather, error } = await weatherService.getWeatherByCoordinates(
        location.latitude,
        location.longitude
      );

      if (error) {
        throw new Error(error);
      }

      if (weather) {
        setWeatherData(weather);
        setSelectedLocation({
          name: weather.location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          country: weather.location.country,
          region: weather.location.region,
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Current location weather error:', error);
      throw error;
    }
  };

  const loadWeatherByCity = async (cityName: string) => {
    try {
      const { weather, error } = await weatherService.getWeatherByCity(cityName);

      if (error) {
        throw new Error(error);
      }

      if (weather) {
        setWeatherData(weather);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('City weather error:', error);
      throw error;
    }
  };

  const refreshWeather = async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      if (useCurrentLocation) {
        await loadWeatherByCurrentLocation();
      } else if (selectedLocation) {
        await loadWeatherByCity(selectedLocation.name);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh weather';
      setError(errorMessage);
      
      if (!silent) {
        Alert.alert('Weather Update Failed', errorMessage);
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };

  const handleLocationSelect = async (location: LocationData) => {
    setShowLocationModal(false);
    setSelectedLocation(location);
    setUseCurrentLocation(false);
    setIsLoading(true);
    setError(null);

    try {
      await loadWeatherByCity(location.name);
    } catch (error) {
      setError('Failed to load weather for selected location');
      Alert.alert('Error', 'Failed to load weather for selected location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setShowLocationModal(false);
    setUseCurrentLocation(true);
    setIsLoading(true);
    setError(null);

    try {
      await loadWeatherByCurrentLocation();
    } catch (error) {
      setError('Failed to get current location weather');
      Alert.alert('Location Error', 'Failed to get current location weather. Please select a city manually.');
      setUseCurrentLocation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string, size: number = 24) => {
    // Map OpenWeatherMap icons to Lucide icons
    const iconMap: { [key: string]: React.ReactNode } = {
      '01d': <Sun size={size} color="#FFA500" />, // clear sky day
      '01n': <Sun size={size} color="#FFD700" />, // clear sky night
      '02d': <Cloud size={size} color="#87CEEB" />, // few clouds day
      '02n': <Cloud size={size} color="#87CEEB" />, // few clouds night
      '03d': <Cloud size={size} color="#B0C4DE" />, // scattered clouds
      '03n': <Cloud size={size} color="#B0C4DE" />,
      '04d': <Cloud size={size} color="#708090" />, // broken clouds
      '04n': <Cloud size={size} color="#708090" />,
      '09d': <CloudRain size={size} color="#4682B4" />, // shower rain
      '09n': <CloudRain size={size} color="#4682B4" />,
      '10d': <CloudRain size={size} color="#1E90FF" />, // rain
      '10n': <CloudRain size={size} color="#1E90FF" />,
      '11d': <Zap size={size} color="#FFD700" />, // thunderstorm
      '11n': <Zap size={size} color="#FFD700" />,
      '13d': <CloudSnow size={size} color="#F0F8FF" />, // snow
      '13n': <CloudSnow size={size} color="#F0F8FF" />,
      '50d': <Cloud size={size} color="#D3D3D3" />, // mist
      '50n': <Cloud size={size} color="#D3D3D3" />,
    };

    return iconMap[iconCode] || <Cloud size={size} color="#87CEEB" />;
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    return formatRelativeTime(lastUpdated);
  };

  if (isLoading && !weatherData) {
    return (
      <View style={[styles.container, style]}>
        <LoadingSpinner size="small" color="#4A90E2" />
        <Text style={styles.loadingText}>{t('weather.loading_weather')}</Text>
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Cloud size={32} color="#E0E0E0" />
        <Text style={styles.errorText}>{t('weather.weather_unavailable')}</Text>
        <TouchableOpacity onPress={() => refreshWeather()} style={styles.retryButton}>
          <RefreshCw size={16} color="#4A90E2" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Main Weather Display */}
      <TouchableOpacity 
        style={styles.weatherCard}
        onPress={() => setShowLocationModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.weatherHeader}>
          <View style={styles.weatherIcon}>
            {weatherData ? getWeatherIcon(weatherData.icon, 32) : <Cloud size={32} color="#87CEEB" />}
          </View>
          
          <View style={styles.weatherInfo}>
            <Text style={styles.temperature}>
              {weatherData ? `${weatherData.temperature}°C` : '--°C'}
            </Text>
            <Text style={styles.description}>
              {weatherData ? weatherData.description : 'Loading...'}
            </Text>
          </View>

          <View style={styles.locationSelector}>
            <MapPin size={16} color="#666" />
            <ChevronDown size={16} color="#666" />
          </View>
        </View>

        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>
            {selectedLocation?.name || weatherData?.location.name || 'Unknown Location'}
          </Text>
          <Text style={styles.locationRegion}>
            {selectedLocation?.region || weatherData?.location.region || ''}
          </Text>
        </View>

        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            {t('weather.updated', { time: formatLastUpdated() })}
          </Text>
        )}
      </TouchableOpacity>

      {/* Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => refreshWeather()}
        disabled={isRefreshing}
      >
        <RefreshCw 
          size={16} 
          color={isRefreshing ? "#999" : "#4A90E2"} 
          style={isRefreshing ? styles.spinning : undefined}
        />
      </TouchableOpacity>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('weather.select_location')}</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              refreshControl={
                <RefreshControl 
                  refreshing={isRefreshing} 
                  onRefresh={() => refreshWeather()} 
                />
              }
            >
              {/* Current Location Option */}
              <TouchableOpacity
                style={[
                  styles.locationOption,
                  useCurrentLocation && styles.selectedLocationOption
                ]}
                onPress={handleUseCurrentLocation}
              >
                <View style={styles.locationOptionIcon}>
                  <Navigation size={20} color="#4A90E2" />
                </View>
                <View style={styles.locationOptionContent}>
                  <Text style={styles.locationOptionTitle}>{t('weather.use_current_location')}</Text>
                  <Text style={styles.locationOptionSubtitle}>
                    {t('weather.automatically_detect')}
                  </Text>
                </View>
                {useCurrentLocation && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>

              {/* City Options */}
              <Text style={styles.sectionTitle}>{t('weather.indonesian_cities')}</Text>
              {INDONESIAN_CITIES.map((city) => (
                <TouchableOpacity
                  key={city.name}
                  style={[
                    styles.locationOption,
                    !useCurrentLocation && selectedLocation?.name === city.name && styles.selectedLocationOption
                  ]}
                  onPress={() => handleLocationSelect(city)}
                >
                  <View style={styles.locationOptionIcon}>
                    <MapPin size={20} color="#666" />
                  </View>
                  <View style={styles.locationOptionContent}>
                    <Text style={styles.locationOptionTitle}>{city.name}</Text>
                    <Text style={styles.locationOptionSubtitle}>{city.region}</Text>
                  </View>
                  {!useCurrentLocation && selectedLocation?.name === city.name && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherIcon: {
    marginRight: 12,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    marginBottom: 8,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  locationRegion: {
    fontSize: 11,
    color: '#999',
  },
  detailedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  refreshButton: {
    marginLeft: 8,
    padding: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
    // Add rotation animation if needed
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedLocationOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  locationOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
  },
  locationOptionContent: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  locationOptionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
  },
});