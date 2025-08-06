import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, CircleCheck as CheckCircle, RefreshCw, X } from 'lucide-react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { imageService } from '@/services/imageService';
import { useAppContext } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

interface SelfieCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSelfieUploaded: (selfieUrl: string) => void;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'general';
  title?: string;
  subtitle?: string;
  autoUpload?: boolean;
}

export function SelfieCapture({
  visible,
  onClose,
  onSelfieUploaded,
  type,
  title = 'Take Selfie',
  subtitle = 'Position your face in the center',
  autoUpload = true,
}: SelfieCaptureProps) {
  const { user } = useAppContext();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setCapturedImage(null);
      setIsProcessing(false);
      setIsUploading(false);
    }
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo) {
        setCapturedImage(photo.uri);
        
        // Auto-upload if enabled
        if (autoUpload) {
          await handleUpload(photo.uri);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (imageUri: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsUploading(true);

    try {
      const result = await imageService.uploadSelfie(user.id, imageUri, type, {
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.error) {
        Alert.alert('Upload Failed', result.error);
        return;
      }

      if (result.url) {
        onSelfieUploaded(result.url);
        Alert.alert('Success', 'Selfie uploaded successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Selfie upload error:', error);
      Alert.alert('Error', 'Failed to upload selfie');
    } finally {
      setIsUploading(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      Alert.alert('Photo Required', 'Please take a selfie to continue.');
      return;
    }

    if (!autoUpload) {
      await handleUpload(capturedImage);
    }
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Requesting camera permission..." />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#E0E0E0" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take selfies for verification.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        // Preview Mode
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{title}</Text>
              <Text style={styles.previewSubtitle}>
                Review your selfie before {autoUpload ? 'uploading' : 'continuing'}
              </Text>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakePicture}
                disabled={isUploading}
              >
                <RefreshCw size={20} color="#4A90E2" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              {!autoUpload && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <>
                      <CheckCircle size={20} color="white" />
                      <Text style={styles.submitButtonText}>Upload Selfie</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.uploadProgress}>
                <LoadingSpinner size="small" color="#4A90E2" />
                <Text style={styles.uploadProgressText}>Uploading selfie...</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        // Camera Mode
        <View style={styles.cameraContainer}>
          {/* Header */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>{title}</Text>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
              <RotateCcw size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsCard}>
              <Camera size={20} color="#4A90E2" />
              <Text style={styles.instructionsText}>{subtitle}</Text>
            </View>
          </View>

          {/* Camera View */}
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              {/* Face Guide Overlay */}
              <View style={styles.faceGuide}>
                <View style={styles.faceGuideCircle} />
              </View>
            </CameraView>
          </View>

          {/* Camera Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.controls}>
              <View style={styles.controlPlaceholder} />
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isProcessing}
              >
                <View style={styles.captureButtonInner}>
                  {isProcessing ? (
                    <RefreshCw size={24} color="white" />
                  ) : (
                    <Camera size={24} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flipCameraButton}
                onPress={toggleCameraFacing}
              >
                <RotateCcw size={24} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.captureHint}>
              Tap to capture your selfie
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8F9FA',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cameraContainer: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  faceGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderStyle: 'dashed',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  controlPlaceholder: {
    width: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipCameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeButtonText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginLeft: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  uploadProgressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
});