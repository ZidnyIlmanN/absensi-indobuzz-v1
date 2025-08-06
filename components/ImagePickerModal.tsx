import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { imageService } from '@/services/imageService';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
  title?: string;
  subtitle?: string;
  allowEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export function ImagePickerModal({
  visible,
  onClose,
  onImageSelected,
  title = 'Select Photo',
  subtitle = 'Choose how you want to add your photo',
  allowEditing = true,
  aspect = [1, 1],
  quality = 0.8,
}: ImagePickerModalProps) {
  const handleCameraCapture = async () => {
    try {
      console.log('Starting camera capture...');
      
      // Check camera permissions first
      const permissions = await imageService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
      
      const result = await imageService.captureFromCamera({
        allowsEditing: allowEditing,
        aspect,
        quality,
      });

      if (result.error) {
        console.error('Camera capture error:', result.error);
        Alert.alert('Camera Error', result.error);
        return;
      }

      if (result.cancelled) {
        console.log('Camera capture cancelled by user');
        return;
      }

      if (result.uri) {
        console.log('Camera capture successful:', result.uri);
        
        // Validate captured image
        const validation = await imageService.validateImageFile(result.uri);
        if (!validation.isValid) {
          Alert.alert('Invalid Image', validation.error || 'The captured image is invalid');
          return;
        }
        
        onImageSelected(result.uri);
        onClose();
      } else {
        console.error('No URI returned from camera capture');
        Alert.alert('Error', 'No image captured');
      }
    } catch (error) {
      console.error('Camera capture exception:', error);
      Alert.alert('Error', 'Failed to capture photo from camera');
    }
  };

  const handleGallerySelection = async () => {
    try {
      console.log('Starting gallery selection...');
      
      // Check gallery permissions first
      const permissions = await imageService.requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert('Permission Required', 'Media library permission is required to select photos');
        return;
      }
      
      const result = await imageService.selectFromGallery({
        allowsEditing: allowEditing,
        aspect,
        quality,
      });

      if (result.error) {
        console.error('Gallery selection error:', result.error);
        Alert.alert('Gallery Error', result.error);
        return;
      }

      if (result.cancelled) {
        console.log('Gallery selection cancelled by user');
        return;
      }

      if (result.uri) {
        console.log('Gallery selection successful:', result.uri);
        
        // Validate selected image
        const validation = await imageService.validateImageFile(result.uri);
        if (!validation.isValid) {
          Alert.alert('Invalid Image', validation.error || 'The selected image is invalid');
          return;
        }
        
        onImageSelected(result.uri);
        onClose();
      } else {
        console.error('No URI returned from gallery selection');
        Alert.alert('Error', 'No image selected');
      }
    } catch (error) {
      console.error('Gallery selection exception:', error);
      Alert.alert('Error', 'Failed to select photo from gallery');
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={styles.option}
              onPress={handleCameraCapture}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Camera size={32} color="#4A90E2" />
              </View>
              <Text style={styles.optionTitle}>Camera</Text>
              <Text style={styles.optionSubtitle}>Take a new photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={handleGallerySelection}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#E8F5E8' }]}>
                <ImageIcon size={32} color="#4CAF50" />
              </View>
              <Text style={styles.optionTitle}>Gallery</Text>
              <Text style={styles.optionSubtitle}>Choose from library</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    flex: 1,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});