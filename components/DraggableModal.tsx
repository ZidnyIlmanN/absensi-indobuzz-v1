import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableModalProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  onSnapPointChange?: (index: number) => void;
  backgroundColor?: string;
  handleColor?: string;
}

export function DraggableModal({
  children,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnapPoint = 0,
  onSnapPointChange,
  backgroundColor = 'white',
  handleColor = '#E0E0E0',
}: DraggableModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const currentSnapIndex = useRef(initialSnapPoint);

  // Convert snap points to actual Y positions
  const snapPositions = snapPoints.map(point => 
    SCREEN_HEIGHT - (SCREEN_HEIGHT * point) - insets.bottom
  );

  useEffect(() => {
    // Initialize to the initial snap point
    translateY.value = withSpring(snapPositions[initialSnapPoint]);
  }, []);

  const gestureHandler = (event: PanGestureHandlerGestureEvent) => {
    'worklet';
    const { translationY, velocityY, state } = event.nativeEvent;
    
    if (state === 2) { // ACTIVE state
      translateY.value = translateY.value + translationY;
    } else if (state === 5) { // END state
      const velocity = velocityY;
      const currentY = translateY.value;
      
      // Find the closest snap point
      let closestSnapIndex = 0;
      let minDistance = Math.abs(currentY - snapPositions[0]);
      
      snapPositions.forEach((snapY, index) => {
        const distance = Math.abs(currentY - snapY);
        if (distance < minDistance) {
          minDistance = distance;
          closestSnapIndex = index;
        }
      });

      // Consider velocity for snap point selection
      if (Math.abs(velocity) > 500) {
        if (velocity > 0 && closestSnapIndex > 0) {
          closestSnapIndex = Math.max(0, closestSnapIndex - 1);
        } else if (velocity < 0 && closestSnapIndex < snapPositions.length - 1) {
          closestSnapIndex = Math.min(snapPositions.length - 1, closestSnapIndex + 1);
        }
      }

      translateY.value = withSpring(snapPositions[closestSnapIndex], {
        damping: 20,
        stiffness: 300,
      });

      // Notify parent of snap point change
      if (currentSnapIndex.current !== closestSnapIndex) {
        currentSnapIndex.current = closestSnapIndex;
        if (onSnapPointChange) {
          runOnJS(onSnapPointChange)(closestSnapIndex);
        }
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }, animatedStyle]}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={styles.handle}>
          <View style={[styles.handleBar, { backgroundColor: handleColor }]} />
        </Animated.View>
      </PanGestureHandler>
      
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});