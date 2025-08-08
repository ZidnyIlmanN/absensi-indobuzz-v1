import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Zap,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Wind,
} from 'lucide-react-native';

interface WeatherIconProps {
  iconCode: string;
  size?: number;
  animated?: boolean;
}

export function WeatherIcon({ iconCode, size = 24, animated = false }: WeatherIconProps) {
  const getWeatherIcon = () => {
    const iconProps = {
      size,
      style: animated ? styles.animated : undefined,
    };

    switch (iconCode) {
      // Clear sky
      case '01d':
        return <Sun {...iconProps} color="#FFA500" />;
      case '01n':
        return <Sun {...iconProps} color="#FFD700" />;
      
      // Few clouds
      case '02d':
      case '02n':
        return <Cloud {...iconProps} color="#87CEEB" />;
      
      // Scattered clouds
      case '03d':
      case '03n':
        return <Cloud {...iconProps} color="#B0C4DE" />;
      
      // Broken clouds
      case '04d':
      case '04n':
        return <Cloud {...iconProps} color="#708090" />;
      
      // Shower rain
      case '09d':
      case '09n':
        return <CloudDrizzle {...iconProps} color="#4682B4" />;
      
      // Rain
      case '10d':
      case '10n':
        return <CloudRain {...iconProps} color="#1E90FF" />;
      
      // Thunderstorm
      case '11d':
      case '11n':
        return <CloudLightning {...iconProps} color="#FFD700" />;
      
      // Snow
      case '13d':
      case '13n':
        return <CloudSnow {...iconProps} color="#F0F8FF" />;
      
      // Mist/Fog
      case '50d':
      case '50n':
        return <Wind {...iconProps} color="#D3D3D3" />;
      
      default:
        return <Cloud {...iconProps} color="#87CEEB" />;
    }
  };

  return (
    <View style={styles.container}>
      {getWeatherIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animated: {
    // Add animation styles if needed
  },
});