import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  PanGestureHandler,
  State,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Minus } from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface DraggableModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  showDragIndicator?: boolean;
  enableDrag?: boolean;
  dismissThreshold?: number; // Percentage of screen height to trigger dismiss
  animationDuration?: number;
  backgroundColor?: string;
  overlayColor?: string;
  borderRadius?: number;
  headerHeight?: number;
}

export function DraggableModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  showDragIndicator = true,
  enableDrag = true,
  dismissThreshold = 0.3, // 30% of screen height
  animationDuration = 300,
  backgroundColor = 'white',
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  borderRadius = 20,
  headerHeight = 60,
}: DraggableModalProps) {
  const insets = useSafeAreaInsets();
  
  // Modal height is 95% of viewport
  const MODAL_HEIGHT = SCREEN_HEIGHT * 0.95;
  const DISMISS_THRESHOLD = SCREEN_HEIGHT * dismissThreshold;
  
  // Animated values
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  // State for tracking drag
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Reset animation values when modal visibility changes
  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      opacity.value = 1;
      scale.value = 1;
    }
  }, [visible]);

  // Handle modal dismissal with animation
  const handleDismiss = () => {
    'worklet';
    
    // Animate modal out
    translateY.value = withTiming(MODAL_HEIGHT, { duration: animationDuration });
    opacity.value = withTiming(0, { duration: animationDuration });
    scale.value = withTiming(0.9, { duration: animationDuration });
    
    // Close modal after animation
    setTimeout(() => {
      runOnJS(onClose)();
    }, animationDuration);
  };

  // Gesture handler for drag functionality
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((event) => {
      'worklet';
      
      // Only allow downward dragging
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        
        // Calculate opacity and scale based on drag distance
        const progress = Math.min(event.translationY / DISMISS_THRESHOLD, 1);
        opacity.value = interpolate(
          progress,
          [0, 1],
          [1, 0.7],
          Extrapolate.CLAMP
        );
        scale.value = interpolate(
          progress,
          [0, 1],
          [1, 0.95],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((event) => {
      'worklet';
      
      runOnJS(setIsDragging)(false);
      
      // Check if drag distance exceeds dismiss threshold
      if (event.translationY > DISMISS_THRESHOLD) {
        // Auto-dismiss modal
        handleDismiss();
      } else {
        // Spring back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
      }
    })
    .enabled(enableDrag);

  // Animated styles for modal container
  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  // Animated styles for overlay
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const overlayOpacity = interpolate(
      translateY.value,
      [0, DISMISS_THRESHOLD],
      [1, 0.3],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: overlayOpacity,
    };
  });

  // Handle overlay press to close modal
  const handleOverlayPress = () => {
    if (!isDragging) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        {/* Animated Overlay */}
        <Animated.View style={[styles.overlay, { backgroundColor: overlayColor }, animatedOverlayStyle]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleOverlayPress}
          />
        </Animated.View>

        {/* Draggable Modal Content */}
        <GestureDetector gesture={dragGesture}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                height: MODAL_HEIGHT,
                backgroundColor,
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
                paddingTop: insets.top,
              },
              animatedModalStyle,
            ]}
          >
            {/* Drag Indicator */}
            {showDragIndicator && (
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>
            )}

            {/* Modal Header */}
            <View style={[styles.header, { height: headerHeight }]}>
              <View style={styles.headerContent}>
                {title && (
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                  </Text>
                )}
                
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <X size={24} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Drag Handle Area (invisible but captures gestures) */}
              {enableDrag && (
                <View style={styles.dragHandle} />
              )}
            </View>

            {/* Modal Body */}
            <View style={styles.body}>
              {children}
            </View>

            {/* Drag Instructions (shown when dragging) */}
            {isDragging && (
              <Animated.View style={styles.dragInstructions}>
                <Minus size={20} color="#999" />
                <Text style={styles.dragInstructionsText}>
                  Drag down to dismiss
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Ensure modal takes exactly 95% of screen height
    maxHeight: SCREEN_HEIGHT * 0.95,
    minHeight: SCREEN_HEIGHT * 0.95,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // This invisible area captures drag gestures on the header
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dragInstructions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  dragInstructionsText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
});