import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
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
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const resetPosition = useCallback(() => {
    translateY.value = withSpring(0);
    isDragging.value = false;
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      // Only allow downward dragging
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      
      const dragDistance = Math.max(0, event.translationY);
      const dragPercentage = dragDistance / SCREEN_HEIGHT;
      const hasHighVelocity = event.velocityY > 1000;

      // Determine if should dismiss or snap back
      const shouldDismiss = 
        dragPercentage > dismissThreshold || 
        (hasHighVelocity && dragPercentage > snapThreshold);

      if (shouldDismiss) {
        // Animate to bottom and dismiss
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
          runOnJS(onClose)();
          translateY.value = 0; // Reset for next time
        });
      } else {
        // Snap back to top
        translateY.value = withSpring(0);
      }
    });

  return {
    panGesture: enableDrag ? panGesture : undefined,
    translateY,
    isDragging,
    resetPosition,
  };
}