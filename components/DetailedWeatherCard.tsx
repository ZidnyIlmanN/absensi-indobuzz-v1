import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  Sun,
  Sunrise,
  Sunset,
  Navigation,
} from 'lucide-react-native';
import { WeatherData } from '@/services/weatherService';
import { WeatherIcon } from './WeatherIcon';

interface DetailedWeatherCardProps {
  weatherData: WeatherData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DetailedWeatherCard({ 
  weatherData, 
  onRefresh, 
  isRefreshing = false 
}: DetailedWeatherCardProps) {
  const weatherDetails = [
    {
      icon: <Thermometer size={20} color="#FF6B6B" />,
      label: 'Feels Like',
      value: `${weatherData.feelsLike}°C`,
    },
    {
      icon: <Droplets size={20} color="#4A90E2" />,
      label: 'Humidity',
      value: `${weatherData.humidity}%`,
    },
    {
      icon: <Wind size={20} color="#4CAF50" />,
      label: 'Wind Speed',
      value: `${weatherData.windSpeed} m/s`,
    },
    {
      icon: <Eye size={20} color="#9C27B0" />,
      label: 'Visibility',
      value: `${weatherData.visibility} km`,
    },
    {
      icon: <Gauge size={20} color="#FF9800" />,
      label: 'Pressure',
      value: `${weatherData.pressure} hPa`,
    },
    {
      icon: <Sun size={20} color="#FFC107" />,
      label: 'UV Index',
      value: weatherData.uvIndex > 0 ? weatherData.uvIndex.toString() : 'N/A',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Main Weather Info */}
      <View style={styles.mainWeatherInfo}>
        <View style={styles.weatherIconContainer}>
          <WeatherIcon iconCode={weatherData.icon} size={64} animated={true} />
        </View>
        
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
          <Text style={styles.description}>{weatherData.description}</Text>
        </View>
      </View>

      {/* Location Info */}
      <View style={styles.locationContainer}>
        <Navigation size={16} color="#666" />
        <Text style={styles.locationText}>
          {weatherData.location.name}, {weatherData.location.region}
        </Text>
      </View>

      {/* Weather Details Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.detailsScrollView}
      >
        <View style={styles.detailsGrid}>
          {weatherDetails.map((detail, index) => (
            <View key={index} style={styles.detailCard}>
              <View style={styles.detailIcon}>
                {detail.icon}
              </View>
              <Text style={styles.detailValue}>{detail.value}</Text>
              <Text style={styles.detailLabel}>{detail.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Refresh Button */}
      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? 'Updating...' : 'Refresh Weather'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginVertical: 8,
  },
  mainWeatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIconContainer: {
    marginRight: 20,
  },
  temperatureContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailsScrollView: {
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailIcon: {
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});