import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const { isLoading } = useAppContext();

  useEffect(() => {
    // Run animation once on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Add timeout to prevent indefinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        Alert.alert(
          'Loading Taking Too Long',
          'The app is taking longer than expected to load. Please try restarting the app.',
          [{ text: 'OK' }]
        );
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <LinearGradient
      colors={['#4A90E2', '#357ABD', '#2E5A87']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Clock size={48} color="white" />
          </View>
        </View>
        
        <Text style={styles.title}>AttendanceApp</Text>
        <Text style={styles.subtitle}>Track your work hours with ease</Text>
        
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
          <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});
