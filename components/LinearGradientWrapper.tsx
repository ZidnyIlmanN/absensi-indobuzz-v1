import React from 'react';
import { View } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

interface LinearGradientWrapperProps {
  colors: string[];
  children: React.ReactNode;
  style?: any;
  locations?: number[];
}

/**
 * Wrapper component for LinearGradient to avoid useInsertionEffect warnings
 * This component wraps the Expo LinearGradient and provides a fallback
 * for cases where the warning occurs
 */
export function LinearGradientWrapper({ 
  colors, 
  children, 
  style, 
  locations 
}: LinearGradientWrapperProps) {
  // Try to use the Expo LinearGradient, but catch any issues
  try {
    // Convert to proper tuple types for Expo LinearGradient
    const colorTuple = colors as [string, string, ...string[]];
    const locationTuple = locations as [number, number, ...number[]] | undefined;
    
    return (
      <ExpoLinearGradient 
        colors={colorTuple} 
        style={style}
        locations={locationTuple}
      >
        {children}
      </ExpoLinearGradient>
    );
  } catch (error) {
    // Fallback to a simple view with background color if there's an issue
    console.warn('LinearGradient error, using fallback:', error);
    return (
      <View 
        style={[
          style,
          { backgroundColor: colors[0] || '#4A90E2' }
        ]}
      >
        {children}
      </View>
    );
  }
}
