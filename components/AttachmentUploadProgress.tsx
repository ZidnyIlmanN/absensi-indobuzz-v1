import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Upload, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Zap } from 'lucide-react-native';
import { LoadingSpinner } from './LoadingSpinner';

interface AttachmentUploadProgressProps {
  visible: boolean;
  progress: number; // 0-100
  currentFile: number;
  totalFiles: number;
  currentFileName?: string;
  compressionEnabled?: boolean;
  onComplete?: () => void;
}

export function AttachmentUploadProgress({
  visible,
  progress,
  currentFile,
  totalFiles,
  currentFileName,
  compressionEnabled = true,
  onComplete,
}: AttachmentUploadProgressProps) {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  React.useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!visible) return null;

  const isComplete = progress >= 100;
  const isProcessing = progress > 0 && progress < 100;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              {isComplete ? (
                <CheckCircle size={32} color="#4CAF50" />
              ) : (
                <Upload size={32} color="#4A90E2" />
              )}
            </View>
            <Text style={styles.title}>
              {isComplete ? 'Upload Complete!' : 'Uploading Attachments'}
            </Text>
          </View>

          {/* Progress Content */}
          <View style={styles.content}>
            {/* File Counter */}
            <Text style={styles.fileCounter}>
              {isComplete ? 'All files processed' : `Processing file ${currentFile} of ${totalFiles}`}
            </Text>

            {/* Current File Name */}
            {currentFileName && !isComplete && (
              <Text style={styles.fileName} numberOfLines={1}>
                {currentFileName}
              </Text>
            )}

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>

            {/* Compression Info */}
            {compressionEnabled && (
              <View style={styles.compressionInfo}>
                <Zap size={16} color="#4CAF50" />
                <Text style={styles.compressionText}>
                  {isComplete 
                    ? 'Images automatically compressed for optimal storage'
                    : 'Compressing images to reduce file size...'
                  }
                </Text>
              </View>
            )}

            {/* Status Messages */}
            <View style={styles.statusContainer}>
              {isProcessing && (
                <View style={styles.statusItem}>
                  <LoadingSpinner size="small" color="#4A90E2" />
                  <Text style={styles.statusText}>
                    {compressionEnabled ? 'Compressing and uploading...' : 'Uploading...'}
                  </Text>
                </View>
              )}

              {isComplete && (
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color="#4CAF50" />
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                    Successfully uploaded {totalFiles} file{totalFiles !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
  },
  fileCounter: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  fileName: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  compressionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  compressionText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 6,
    flex: 1,
  },
  statusContainer: {
    width: '100%',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});