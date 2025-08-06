import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { imageService } from '@/services/imageService';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
}

interface UseImageUploadOptions {
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  autoShowAlerts?: boolean;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    autoShowAlerts = true,
  } = options;

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null,
  });

  const updateProgress = useCallback((progress: number) => {
    setUploadState(prev => ({ ...prev, progress }));
    onUploadProgress?.(progress);
  }, [onUploadProgress]);

  const uploadSelfie = useCallback(async (
    userId: string,
    imageUri: string,
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general'
  ) => {
    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        uploadedUrl: null,
      });

      onUploadStart?.();
      updateProgress(10);

      // Simulate compression progress
      updateProgress(30);

      const result = await imageService.uploadSelfie(userId, imageUri, type, {
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      });

      updateProgress(80);

      if (result.error) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: result.error,
        }));

        onUploadError?.(result.error!);
        
        if (autoShowAlerts) {
          Alert.alert('Upload Failed', result.error);
        }

        return { url: null, error: result.error };
      }

      updateProgress(100);

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        uploadedUrl: result.url,
      });

      onUploadComplete?.(result.url!);

      if (autoShowAlerts) {
        Alert.alert('Success', 'Selfie uploaded successfully!');
      }

      return { url: result.url, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));

      onUploadError?.(errorMessage);

      if (autoShowAlerts) {
        Alert.alert('Error', errorMessage);
      }

      return { url: null, error: errorMessage };
    }
  }, [onUploadStart, onUploadComplete, onUploadError, autoShowAlerts, updateProgress]);

  const uploadProfilePhoto = useCallback(async (
    userId: string,
    imageUri: string
  ) => {
    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        uploadedUrl: null,
      });

      onUploadStart?.();
      updateProgress(10);

      const result = await imageService.updateProfilePhotoComplete(userId, imageUri);

      updateProgress(80);

      if (result.error) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: result.error,
        }));

        onUploadError?.(result.error!);
        
        if (autoShowAlerts) {
          Alert.alert('Upload Failed', result.error);
        }

        return { url: null, error: result.error };
      }

      updateProgress(100);

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        uploadedUrl: result.avatarUrl,
      });

      onUploadComplete?.(result.avatarUrl!);

      if (autoShowAlerts) {
        Alert.alert('Success', 'Profile photo updated successfully!');
      }

      return { url: result.avatarUrl, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));

      onUploadError?.(errorMessage);

      if (autoShowAlerts) {
        Alert.alert('Error', errorMessage);
      }

      return { url: null, error: errorMessage };
    }
  }, [onUploadStart, onUploadComplete, onUploadError, autoShowAlerts, updateProgress]);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
    });
  }, []);

  return {
    ...uploadState,
    uploadSelfie,
    uploadProfilePhoto,
    resetUploadState,
  };
}