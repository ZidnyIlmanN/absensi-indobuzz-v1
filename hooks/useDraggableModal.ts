import { useState, useRef, useCallback } from 'react';
import { Animated, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UseDraggableModalOptions {
  onClose: () => void;
  dismissThreshold?: number; // Percentage of screen height to trigger dismiss (0-1)
  snapThreshold?: number; // Percentage to snap back to top (0-1)
  enableDrag?: boolean;
}

export function useDraggableModal({
  onClose,
  dismissThreshold = 0.3, // Dismiss when dragged 30% down
  snapThreshold = 0.15, // Snap back if dragged less than 15%
  enableDrag = true,
}: UseDraggableModalOptions) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastGestureY = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const onGestureEvent = useCallback(
    Animated.event(
      [{ nativeEvent: { translationY: translateY } }],
      { 
        useNativeDriver: false,
        listener: (event: any) => {
          const { translationY } = event.nativeEvent;
          lastGestureY.current = translationY;
          
          // Only allow downward dragging
          if (translationY < 0) {
            translateY.setValue(0);
          }
        }
      }
    ),
    [translateY]
  );

  const onHandlerStateChange = useCallback(
    (event: any) => {
      const { state, translationY, velocityY } = event.nativeEvent;

      switch (state) {
        case State.BEGAN:
          setIsDragging(true);
          break;

        case State.END:
        case State.CANCELLED:
        case State.FAILED:
          setIsDragging(false);
          
          const dragDistance = Math.max(0, translationY);
          const dragPercentage = dragDistance / SCREEN_HEIGHT;
          const hasHighVelocity = velocityY > 1000;

          // Determine if should dismiss or snap back
          const shouldDismiss = 
            dragPercentage > dismissThreshold || 
            (hasHighVelocity && dragPercentage > snapThreshold);

          if (shouldDismiss) {
            // Animate to bottom and dismiss
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              onClose();
              translateY.setValue(0); // Reset for next time
            });
          } else {
            // Snap back to top
            Animated.spring(translateY, {
              toValue: 0,
              damping: 20,
              stiffness: 300,
              useNativeDriver: false,
            }).start();
          }
          break;
      }
    },
    [translateY, onClose, dismissThreshold, snapThreshold]
  );

  const resetPosition = useCallback(() => {
    translateY.setValue(0);
    setIsDragging(false);
  }, [translateY]);

  return {
    panGestureHandler: enableDrag ? {
      onGestureEvent,
      onHandlerStateChange,
    } : undefined,
    translateY,
    isDragging,
    resetPosition,
  };
}