import { useState, useEffect, useCallback } from 'react';
import { weatherService, WeatherData, LocationData, INDONESIAN_CITIES } from '@/services/weatherService';
import { getCurrentLocation } from '@/utils/location';

interface WeatherState {
  weatherData: WeatherData | null;
  selectedLocation: LocationData | null;
  useCurrentLocation: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  defaultCity?: string;
}

export function useWeather(options: UseWeatherOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 10,
    defaultCity = 'Jakarta',
  } = options;

  const [weatherState, setWeatherState] = useState<WeatherState>({
    weatherData: null,
    selectedLocation: null,
    useCurrentLocation: true,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const loadWeatherByCurrentLocation = useCallback(async () => {
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
        setWeatherState(prev => ({
          ...prev,
          weatherData: weather,
          selectedLocation: {
            name: weather.location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            country: weather.location.country,
            region: weather.location.region,
          },
          lastUpdated: new Date(),
          error: null,
        }));
      }
    } catch (error) {
      console.error('Current location weather error:', error);
      throw error;
    }
  }, []);

  const loadWeatherByCity = useCallback(async (cityName: string) => {
    try {
      const { weather, error } = await weatherService.getWeatherByCity(cityName);

      if (error) {
        throw new Error(error);
      }

      if (weather) {
        const city = INDONESIAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
        
        setWeatherState(prev => ({
          ...prev,
          weatherData: weather,
          selectedLocation: city || {
            name: weather.location.name,
            latitude: 0,
            longitude: 0,
            country: weather.location.country,
            region: weather.location.region,
          },
          lastUpdated: new Date(),
          error: null,
        }));
      }
    } catch (error) {
      console.error('City weather error:', error);
      throw error;
    }
  }, []);

  const refreshWeather = useCallback(async (silent = false) => {
    if (!silent) {
      setWeatherState(prev => ({ ...prev, isLoading: true }));
    }
    
    setWeatherState(prev => ({ ...prev, error: null }));

    try {
      if (weatherState.useCurrentLocation) {
        await loadWeatherByCurrentLocation();
      } else if (weatherState.selectedLocation) {
        await loadWeatherByCity(weatherState.selectedLocation.name);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh weather';
      setWeatherState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      if (!silent) {
        setWeatherState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [weatherState.useCurrentLocation, weatherState.selectedLocation, loadWeatherByCurrentLocation, loadWeatherByCity]);

  const selectLocation = useCallback(async (location: LocationData) => {
    setWeatherState(prev => ({
      ...prev,
      selectedLocation: location,
      useCurrentLocation: false,
      isLoading: true,
      error: null,
    }));

    try {
      await loadWeatherByCity(location.name);
    } catch (error) {
      setWeatherState(prev => ({
        ...prev,
        error: 'Failed to load weather for selected location',
        isLoading: false,
      }));
    }
  }, [loadWeatherByCity]);

  const useCurrentLocationWeather = useCallback(async () => {
    setWeatherState(prev => ({
      ...prev,
      useCurrentLocation: true,
      isLoading: true,
      error: null,
    }));

    try {
      await loadWeatherByCurrentLocation();
    } catch (error) {
      setWeatherState(prev => ({
        ...prev,
        error: 'Failed to get current location weather',
        useCurrentLocation: false,
        isLoading: false,
      }));
    }
  }, [loadWeatherByCurrentLocation]);

  // Initialize weather data
  useEffect(() => {
    const initializeWeather = async () => {
      try {
        if (weatherState.useCurrentLocation) {
          await loadWeatherByCurrentLocation();
        } else {
          const defaultCityData = INDONESIAN_CITIES.find(c => c.name === defaultCity) || INDONESIAN_CITIES[0];
          await selectLocation(defaultCityData);
        }
      } catch (error) {
        console.error('Weather initialization error:', error);
        // Fallback to mock data
        setWeatherState(prev => ({
          ...prev,
          weatherData: weatherService.getMockWeatherData(defaultCity),
          error: 'Using demo weather data',
          isLoading: false,
        }));
      }
    };

    initializeWeather();
  }, []); // Only run on mount

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshWeather(true); // Silent refresh
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshWeather]);

  return {
    ...weatherState,
    refreshWeather,
    selectLocation,
    useCurrentLocationWeather,
    availableCities: INDONESIAN_CITIES,
  };
}