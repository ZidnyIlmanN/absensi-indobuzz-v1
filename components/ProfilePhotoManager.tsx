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

  const handleImageSelected = async (imageUri: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    console.log('Profile photo selected:', imageUri);
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Upload and update profile photo
      const result = await imageService.updateProfilePhotoComplete(user.id, imageUri);

      if (result.error) {
        console.error('Profile photo upload failed:', result.error);
        Alert.alert('Upload Failed', result.error);
        return;
      }

      if (result.avatarUrl) {
        console.log('Profile photo uploaded successfully:', result.avatarUrl);
        // Update local context
        await updateProfile({ avatar: result.avatarUrl });
        
        // Show success feedback
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);

        // Notify parent component
        onPhotoUpdated?.(result.avatarUrl);

        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        console.error('No avatar URL returned from upload');
        Alert.alert('Upload Failed', 'No avatar URL returned from upload');
      }
    } catch (error) {
      console.error('Profile photo update error:', error);
      Alert.alert('Error', `Failed to update profile photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        
        {/* Loading Overlay */}
        {isUploading && (
          <View style={[styles.loadingOverlay, { width: size, height: size }]}>
            <LoadingSpinner size="small" color="white" />
          </View>
        )}

        {/* Success Overlay */}
        {uploadSuccess && (
          <View style={[styles.successOverlay, { width: size, height: size }]}>
            <Check size={24} color="white" />
          </View>
        )}

        {/* Edit Button */}
        {showEditButton && (
          <TouchableOpacity
            style={[styles.editButton, { bottom: size * 0.05, right: size * 0.05 }]}
            onPress={() => setShowImagePicker(true)}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            <Camera size={size > 100 ? 20 : 16} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Image Picker Modal */}
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
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 999,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photo: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#4A90E2',
    borderRadius: 999,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});