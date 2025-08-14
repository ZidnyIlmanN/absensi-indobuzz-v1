import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MapPin, Users, Clock, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';

export function LiveTrackingCard() {
  const { t } = useTranslation();
  const { currentAttendance, isWorking, workHours } = useAppContext();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Show card only when user is working
  const shouldShow = isWorking && currentAttendance;

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const handlePress = () => {
    router.push('/live-tracking');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MapPin size={20} color="#4A90E2" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {t('live_tracking.live_tracking_active')}
            </Text>
            <Text style={styles.subtitle}>
              {t('live_tracking.location_being_tracked')} • {workHours}
            </Text>
          </View>
          <ChevronRight size={20} color="#999" />
        </View>
        
        <View style={styles.locationInfo}>
          <MapPin size={14} color="#666" />
          <Text style={styles.locationText}>
            PT. INDOBUZZ REPUBLIK DIGITAL
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 44,
  },
  locationText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4,
    fontWeight: '500',
  },
});