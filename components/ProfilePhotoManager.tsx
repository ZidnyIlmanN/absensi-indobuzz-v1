import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Camera, User, Check } from 'lucide-react-native';
import { ImagePickerModal } from './ImagePickerModal';
import { LoadingSpinner } from './LoadingSpinner';
import { imageService } from '@/services/imageService';
import { useAppContext } from '@/context/AppContext';

interface ProfilePhotoManagerProps {
  currentAvatarUrl?: string;
  size?: number;
  showEditButton?: boolean;
  onPhotoUpdated?: (newAvatarUrl: string) => void;
}

export function ProfilePhotoManager({
  currentAvatarUrl,
  size = 120,
  showEditButton = true,
  onPhotoUpdated,
}: ProfilePhotoManagerProps) {
  const { user, updateProfile } = useAppContext();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageSelected = async (imageUri: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    try {
      const result = await imageService.updateProfilePhotoComplete(user.id, imageUri);

      if (result.error) {
        setUploadError(result.error);
        setTimeout(() => setUploadError(null), 3000); // Hide error after 3s
        return;
      }

      if (result.avatarUrl) {
        await updateProfile({ avatar: result.avatarUrl });
        
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000); // Hide success after 2s

        onPhotoUpdated?.(result.avatarUrl);
      } else {
        setUploadError('No avatar URL returned');
        setTimeout(() => setUploadError(null), 3000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const getDisplayUrl = () => {
    return currentAvatarUrl || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4A90E2&color=fff&size=${size}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.photoContainer, { width: size, height: size }]}>
        <Image 
          source={{ uri: getDisplayUrl() }} 
          style={[styles.photo, { width: size, height: size }]} 
        />
        
        {isUploading && (
          <View style={[styles.loadingOverlay, { width: size, height: size }]}>
            <LoadingSpinner size="small" color="white" />
          </View>
        )}

        {uploadSuccess && (
          <View style={[styles.successOverlay, { width: size, height: size }]}>
            <Check size={size * 0.4} color="white" />
          </View>
        )}

        {uploadError && (
          <View style={[styles.errorOverlay, { width: size, height: size }]}>
            <Text style={styles.errorText}>{uploadError}</Text>
          </View>
        )}

        {showEditButton && !isUploading && !uploadSuccess && (
          <TouchableOpacity
            style={[styles.editButton, { width: size * 0.3, height: size * 0.3 }]}
            onPress={() => setShowImagePicker(true)}
            activeOpacity={0.8}
          >
            <Camera size={size * 0.15} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
        title="Update Profile Photo"
        subtitle="Choose how you want to update your profile photo"
        allowEditing={true}
        aspect={[1, 1]}
        quality={0.8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 999,
    overflow: 'visible', // Allow button to sit on top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  photo: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: '#E0E0E0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 188, 156, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
  editButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#3498db',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 5,
  },
});