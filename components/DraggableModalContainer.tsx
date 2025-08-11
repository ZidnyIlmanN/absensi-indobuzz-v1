import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
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
  const {
    panGestureHandler,
    translateY,
    isDragging,
    resetPosition,
  } = useDraggableModal({
    onClose,
    dismissThreshold,
    snapThreshold,
    enableDrag,
  });

  React.useEffect(() => {
    if (visible) {
      resetPosition();
    }
  }, [visible, resetPosition]);

  if (!visible) return null;

  const modalContent = (
    <Animated.View
      style={[
        styles.modalContent,
        {
          transform: [{ translateY }],
          opacity: isDragging ? 0.95 : 1,
        },
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
      
      {enableDrag && panGestureHandler ? (
        <PanGestureHandler {...panGestureHandler}>
          {modalContent}
        </PanGestureHandler>
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