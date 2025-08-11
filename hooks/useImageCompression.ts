import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { imageCompressionService, CompressionResult } from '@/services/imageCompressionService';
import { leaveAttachmentService } from '@/services/leaveAttachmentService';

interface CompressionState {
  isCompressing: boolean;
  progress: number;
  currentFile: number;
  totalFiles: number;
  results: CompressionResult[];
  error: string | null;
}

interface UseImageCompressionOptions {
  onCompressionStart?: () => void;
  onCompressionProgress?: (progress: number, currentFile: number, totalFiles: number) => void;
  onCompressionComplete?: (results: CompressionResult[]) => void;
  onCompressionError?: (error: string) => void;
  autoShowAlerts?: boolean;
  compressionPreset?: 'high_quality' | 'balanced' | 'mobile_optimized' | 'thumbnail';
}

export function useImageCompression(options: UseImageCompressionOptions = {}) {
  const {
    onCompressionStart,
    onCompressionProgress,
    onCompressionComplete,
    onCompressionError,
    autoShowAlerts = true,
    compressionPreset = 'balanced',
  } = options;

  const [compressionState, setCompressionState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    currentFile: 0,
    totalFiles: 0,
    results: [],
    error: null,
  });

  const updateProgress = useCallback((currentFile: number, totalFiles: number) => {
    const progress = totalFiles > 0 ? (currentFile / totalFiles) * 100 : 0;
    
    setCompressionState(prev => ({
      ...prev,
      progress,
      currentFile,
      totalFiles,
    }));

    onCompressionProgress?.(progress, currentFile, totalFiles);
  }, [onCompressionProgress]);

  const compressSingleImage = useCallback(async (
    imageUri: string,
    targetUseCase: 'document' | 'photo' | 'receipt' | 'general' = 'general'
  ) => {
    try {
      setCompressionState({
        isCompressing: true,
        progress: 0,
        currentFile: 1,
        totalFiles: 1,
        results: [],
        error: null,
      });

      onCompressionStart?.();

      const config = imageCompressionService.getCompressionPreset(compressionPreset);
      const result = await imageCompressionService.compressImage(imageUri, config, targetUseCase);

      updateProgress(1, 1);

      if (result.error) {
        setCompressionState(prev => ({
          ...prev,
          isCompressing: false,
          error: result.error!,
        }));

        onCompressionError?.(result.error);

        if (autoShowAlerts) {
          Alert.alert('Compression Failed', result.error);
        }

        return { result: null, error: result.error };
      }

      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        results: [result],
      }));

      onCompressionComplete?.([result]);

      if (autoShowAlerts) {
        const savingsPercentage = Math.round(result.compressionRatio * 100);
        Alert.alert(
          'Compression Complete',
          `Image compressed successfully! ${savingsPercentage}% size reduction.`
        );
      }

      return { result, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      
      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        error: errorMessage,
      }));

      onCompressionError?.(errorMessage);

      if (autoShowAlerts) {
        Alert.alert('Error', errorMessage);
      }

      return { result: null, error: errorMessage };
    }
  }, [compressionPreset, onCompressionStart, onCompressionComplete, onCompressionError, autoShowAlerts, updateProgress]);

  const compressImageBatch = useCallback(async (
    imageUris: string[],
    targetUseCase: 'document' | 'photo' | 'receipt' | 'general' = 'general'
  ) => {
    try {
      setCompressionState({
        isCompressing: true,
        progress: 0,
        currentFile: 0,
        totalFiles: imageUris.length,
        results: [],
        error: null,
      });

      onCompressionStart?.();

      const config = imageCompressionService.getCompressionPreset(compressionPreset);
      const results = await imageCompressionService.compressImageBatch(
        imageUris,
        config,
        (completed, total) => updateProgress(completed, total)
      );

      const successfulResults = results.filter(r => !r.error);
      const failedResults = results.filter(r => r.error);

      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        results: successfulResults,
        error: failedResults.length > 0 ? `${failedResults.length} files failed to compress` : null,
      }));

      onCompressionComplete?.(successfulResults);

      if (autoShowAlerts) {
        if (failedResults.length === 0) {
          const avgSavings = successfulResults.reduce((sum, r) => sum + r.compressionRatio, 0) / successfulResults.length;
          const avgSavingsPercentage = Math.round(avgSavings * 100);
          
          Alert.alert(
            'Batch Compression Complete',
            `${successfulResults.length} images compressed successfully! Average ${avgSavingsPercentage}% size reduction.`
          );
        } else {
          Alert.alert(
            'Batch Compression Completed with Errors',
            `${successfulResults.length} images compressed successfully, ${failedResults.length} failed.`
          );
        }
      }

      return { results: successfulResults, error: failedResults.length > 0 ? 'Some files failed' : null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch compression failed';
      
      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        error: errorMessage,
      }));

      onCompressionError?.(errorMessage);

      if (autoShowAlerts) {
        Alert.alert('Error', errorMessage);
      }

      return { results: [], error: errorMessage };
    }
  }, [compressionPreset, onCompressionStart, onCompressionComplete, onCompressionError, autoShowAlerts, updateProgress]);

  const uploadWithCompression = useCallback(async (
    userId: string,
    imageUris: string[]
  ) => {
    try {
      setCompressionState({
        isCompressing: true,
        progress: 0,
        currentFile: 0,
        totalFiles: imageUris.length,
        results: [],
        error: null,
      });

      onCompressionStart?.();

      const uploadResults = await leaveAttachmentService.uploadMultipleAttachments(
        userId,
        imageUris,
        {
          compressionPreset,
          generateThumbnail: true,
          validateBeforeUpload: true,
        },
        (completed, total) => updateProgress(completed, total)
      );

      const successfulUploads = uploadResults.filter(r => !r.error);
      const failedUploads = uploadResults.filter(r => r.error);

      // Convert upload results to compression results
      const compressionResults: CompressionResult[] = successfulUploads
        .map(upload => upload.compressionStats)
        .filter(stats => stats !== undefined) as CompressionResult[];

      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        results: compressionResults,
        error: failedUploads.length > 0 ? `${failedUploads.length} uploads failed` : null,
      }));

      onCompressionComplete?.(compressionResults);

      if (autoShowAlerts) {
        if (failedUploads.length === 0) {
          Alert.alert('Upload Complete', `${successfulUploads.length} files uploaded and compressed successfully!`);
        } else {
          Alert.alert(
            'Upload Completed with Errors',
            `${successfulUploads.length} files uploaded successfully, ${failedUploads.length} failed.`
          );
        }
      }

      return { 
        uploadUrls: successfulUploads.map(r => r.url).filter(url => url !== null) as string[],
        compressionResults,
        error: failedUploads.length > 0 ? 'Some uploads failed' : null 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload with compression failed';
      
      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        error: errorMessage,
      }));

      onCompressionError?.(errorMessage);

      if (autoShowAlerts) {
        Alert.alert('Error', errorMessage);
      }

      return { uploadUrls: [], compressionResults: [], error: errorMessage };
    }
  }, [userId, compressionPreset, onCompressionStart, onCompressionComplete, onCompressionError, autoShowAlerts, updateProgress]);

  const resetCompressionState = useCallback(() => {
    setCompressionState({
      isCompressing: false,
      progress: 0,
      currentFile: 0,
      totalFiles: 0,
      results: [],
      error: null,
    });
  }, []);

  const getCompressionStats = useCallback(() => {
    return imageCompressionService.getCompressionStats();
  }, []);

  return {
    ...compressionState,
    compressSingleImage,
    compressImageBatch,
    uploadWithCompression,
    resetCompressionState,
    getCompressionStats,
  };
}