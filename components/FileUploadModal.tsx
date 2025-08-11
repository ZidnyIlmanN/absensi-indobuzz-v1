import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Camera, File, Upload, X, FileText, Image as ImageIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { imageService } from '@/services/imageService';

interface FileUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onFileSelected: (uri: string) => void;
  title?: string;
  subtitle?: string;
  allowedTypes?: string[];
  maxFileSize?: number; // in bytes
}

export function FileUploadModal({
  visible,
  onClose,
  onFileSelected,
  title = 'Add Attachment',
  subtitle = 'Choose how you want to add your file',
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCameraCapture = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
      
      const result = await imageService.captureFromCamera({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert('Camera Error', result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        onFileSelected(result.uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo from camera');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallerySelection = async () => {
    try {
      setIsProcessing(true);
      
      const permissions = await imageService.requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert('Permission Required', 'Media library permission is required to select photos');
        return;
      }
      
      const result = await imageService.selectFromGallery({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.error) {
        Alert.alert('Gallery Error', result.error);
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.uri) {
        onFileSelected(result.uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo from gallery');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentSelection = async () => {
    try {
      setIsProcessing(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size
        if (asset.size && asset.size > maxFileSize) {
          Alert.alert(
            'File Too Large',
            `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
          );
          return;
        }

        onFileSelected(asset.uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadOptions = [
    {
      id: 'camera',
      title: 'Camera',
      subtitle: 'Take a new photo',
      icon: <Camera size={32} color="#4A90E2" />,
      backgroundColor: '#E3F2FD',
      onPress: handleCameraCapture,
    },
    {
      id: 'gallery',
      title: 'Photo Gallery',
      subtitle: 'Choose from gallery',
      icon: <ImageIcon size={32} color="#4CAF50" />,
      backgroundColor: '#E8F5E8',
      onPress: handleGallerySelection,
    },
    {
      id: 'document',
      title: 'Document',
      subtitle: 'Select PDF or other files',
      icon: <FileText size={32} color="#FF9800" />,
      backgroundColor: '#FFF3E0',
      onPress: handleDocumentSelection,
    },
  ];

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

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {uploadOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.option}
                onPress={option.onPress}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.backgroundColor }]}>
                  {option.icon}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Upload size={16} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              Supported formats: Images (JPG, PNG), PDF, Word documents, Text files
            </Text>
            <Text style={styles.footerNote}>
              Maximum file size: {Math.round(maxFileSize / (1024 * 1024))}MB
            </Text>
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
    maxHeight: '80%',
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
  optionsContainer: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});