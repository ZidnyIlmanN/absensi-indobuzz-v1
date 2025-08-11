import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useDraggableModal } from '@/hooks/useDraggableModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableModalContainerProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  enableDrag?: boolean;
  dismissThreshold?: number;
  snapThreshold?: number;
}

export function DraggableModalContainer({
  children,
  visible,
  onClose,
  enableDrag = true,
  dismissThreshold = 0.3,
  snapThreshold = 0.15,
}: DraggableModalContainerProps) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const resetPosition = () => {
    translateY.value = withSpring(0);
    isDragging.value = false;
  };

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: isDragging.value ? 0.95 : 1,
  }));

  React.useEffect(() => {
    if (visible) {
      resetPosition();
    }
  }, [visible]);

  if (!visible) return null;

  const modalContent = (
    <Animated.View
      style={[
        styles.modalContent,
        animatedStyle,
      ]}
    >
      {/* Drag Handle */}
      <View style={styles.dragHandle} />
      
      {/* Modal Content */}
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      {enableDrag ? (
        <GestureDetector gesture={panGesture}>
          {modalContent}
        </GestureDetector>
      ) : (
        modalContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '95%',
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
});