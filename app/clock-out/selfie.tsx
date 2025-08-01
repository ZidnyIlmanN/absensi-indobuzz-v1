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
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Camera, RotateCcw, CircleCheck as CheckCircle, RefreshCw, LogOut, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

export default function ClockOutSelfieScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

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
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
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

    setIsProcessing(true);

    try {
      // Simulate API call for face verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clock out with selfie
      const { error } = await clockOut(capturedImage);

      if (error) {
        throw new Error(error);
      }

      // Update app state
      dispatch({ type: 'SET_WORKING_STATUS', payload: false });
      dispatch({ type: 'SET_CURRENT_STATUS', payload: 'ready' });
      dispatch({ type: 'SET_WORK_HOURS', payload: '00:00' });
      dispatch({ type: 'SET_BREAK_TIME', payload: '00:00' });
      dispatch({ type: 'SET_OVERTIME_HOURS', payload: '00:00' });
      dispatch({ type: 'SET_CLIENT_VISIT_TIME', payload: '00:00' });

      // Navigate back to live attendance
      router.replace('/live-attendance');
      
      Alert.alert(
        'Success!',
        'You have successfully clocked out. Have a great rest of your day!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting clock out:', error);
      Alert.alert(
        'Clock Out Failed',
        error instanceof Error ? error.message : 'Please try again with better lighting.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#F44336', '#D32F2F']}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Clock Out Selfie</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.permissionContainer}>
          <Camera size={64} color="#E0E0E0" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take a selfie for clock out verification.
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
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#F44336', '#D32F2F']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clock Out Selfie</Text>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <RotateCcw size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Final Step</Text>
        </View>
      </LinearGradient>

      {capturedImage ? (
        // Preview Mode
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Clock Out Confirmation</Text>
              <Text style={styles.previewSubtitle}>
                Verify your identity to complete clock out
              </Text>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakePicture}
              >
                <RefreshCw size={20} color="#F44336" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#F44336', '#D32F2F']}
                  style={styles.submitButtonGradient}
                >
                  {isProcessing ? (
                    <Text style={styles.submitButtonText}>Processing...</Text>
                  ) : (
                    <>
                      <CheckCircle size={20} color="white" />
                      <Text style={styles.submitButtonText}>Complete Clock Out</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        // Camera Mode
        <View style={styles.cameraContainer}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsCard}>
              <LogOut size={20} color="#F44336" />
              <Text style={styles.instructionsText}>
                Position your face in the center and tap to capture your clock out selfie
              </Text>
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
              Tap to capture your clock out selfie
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
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
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
  placeholder: {
    width: 40,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: '#F44336',
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
  instructionsContainer: {
    position: 'absolute',
    top: 20,
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
    borderColor: 'rgba(244, 67, 54, 0.8)',
    borderStyle: 'dashed',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
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
    backgroundColor: '#F44336',
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
    marginLeft: 16,
    borderRadius: 12,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});