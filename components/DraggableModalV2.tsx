import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Minus } from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface DraggableModalV2Props {
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

/**
 * Alternative implementation using PanResponder for broader compatibility
 * This version works without react-native-reanimated dependency
 */
export function DraggableModalV2({
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
}: DraggableModalV2Props) {
  const insets = useSafeAreaInsets();
  
  // Modal height is 95% of viewport
  const MODAL_HEIGHT = SCREEN_HEIGHT * 0.95;
  const DISMISS_THRESHOLD = SCREEN_HEIGHT * dismissThreshold;
  
  // Animated values
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // State for tracking drag
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);

  // Reset animation values when modal visibility changes
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      opacity.setValue(1);
      scale.setValue(1);
      overlayOpacity.setValue(1);
      currentTranslateY.current = 0;
    }
  }, [visible]);

  // Listen to translateY changes to update overlay opacity
  useEffect(() => {
    const listener = translateY.addListener(({ value }) => {
      currentTranslateY.current = value;
      
      // Update overlay opacity based on drag distance
      const progress = Math.min(value / DISMISS_THRESHOLD, 1);
      const newOverlayOpacity = 1 - (progress * 0.7); // Fade to 30% opacity
      overlayOpacity.setValue(Math.max(newOverlayOpacity, 0.3));
    });

    return () => {
      translateY.removeListener(listener);
    };
  }, []);

  // Handle modal dismissal with animation
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: MODAL_HEIGHT,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Spring back to original position
  const springBack = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(overlayOpacity, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // PanResponder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical drags and only if drag is enabled
        return enableDrag && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt, gestureState) => {
        setIsDragging(true);
        dragStartY.current = currentTranslateY.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward dragging
        const newTranslateY = Math.max(0, dragStartY.current + gestureState.dy);
        
        translateY.setValue(newTranslateY);
        
        // Calculate opacity and scale based on drag distance
        const progress = Math.min(newTranslateY / DISMISS_THRESHOLD, 1);
        const newOpacity = 1 - (progress * 0.3); // Fade to 70% opacity
        const newScale = 1 - (progress * 0.05); // Scale to 95%
        
        opacity.setValue(Math.max(newOpacity, 0.7));
        scale.setValue(Math.max(newScale, 0.95));
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        
        const finalTranslateY = dragStartY.current + gestureState.dy;
        
        // Check if drag distance exceeds dismiss threshold
        if (finalTranslateY > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          // Auto-dismiss modal
          handleDismiss();
        } else {
          // Spring back to original position
          springBack();
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        springBack();
      },
    })
  ).current;

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
        <Animated.View style={[styles.overlay, { backgroundColor: overlayColor, opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleOverlayPress}
          />
        </Animated.View>

        {/* Draggable Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              height: MODAL_HEIGHT,
              backgroundColor,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              paddingTop: insets.top,
              transform: [
                { translateY },
                { scale },
              ],
              opacity,
            },
          ]}
          {...(enableDrag ? panResponder.panHandlers : {})}
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