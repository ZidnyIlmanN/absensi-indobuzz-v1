import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface CompressionConfig {
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
  targetSizeKB?: number; // Target file size in KB
  enableProgressiveJPEG?: boolean;
}

export interface CompressionResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  format: string;
  error?: string;
}

export interface CompressionStats {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  averageCompressionRatio: number;
  processedCount: number;
}

/**
 * Advanced Image Compression Service for Leave Attachments
 * 
 * Features:
 * - Automatic format optimization (JPEG for photos, PNG for graphics)
 * - Progressive compression with quality adjustment
 * - Size-based compression levels
 * - Batch processing support
 * - Compression analytics
 */
export class ImageCompressionService {
  private static instance: ImageCompressionService;
  private compressionStats: CompressionStats = {
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavings: 0,
    averageCompressionRatio: 0,
    processedCount: 0,
  };

  // Compression presets for different use cases
  private readonly COMPRESSION_PRESETS = {
    // High quality for important documents
    high_quality: {
      quality: 0.9,
      maxWidth: 1920,
      maxHeight: 1920,
      format: 'jpeg' as const,
      targetSizeKB: 800,
    },
    // Balanced quality for general attachments
    balanced: {
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      format: 'jpeg' as const,
      targetSizeKB: 500,
    },
    // Optimized for mobile viewing
    mobile_optimized: {
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800,
      format: 'jpeg' as const,
      targetSizeKB: 300,
    },
    // Maximum compression for thumbnails
    thumbnail: {
      quality: 0.6,
      maxWidth: 400,
      maxHeight: 400,
      format: 'jpeg' as const,
      targetSizeKB: 100,
    },
  };

  public static getInstance(): ImageCompressionService {
    if (!ImageCompressionService.instance) {
      ImageCompressionService.instance = new ImageCompressionService();
    }
    return ImageCompressionService.instance;
  }

  /**
   * Get optimal compression config based on image characteristics
   */
  private async getOptimalCompressionConfig(
    imageUri: string,
    targetUseCase: 'document' | 'photo' | 'receipt' | 'general' = 'general'
  ): Promise<CompressionConfig> {
    try {
      // Get image info to determine optimal settings
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], { base64: false });
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      const { width, height } = imageInfo;
      const fileSizeKB = fileInfo.size ? fileInfo.size / 1024 : 0;

      console.log('📊 Image analysis:', {
        dimensions: `${width}x${height}`,
        fileSizeKB: Math.round(fileSizeKB),
        targetUseCase,
      });

      // Determine optimal preset based on image characteristics
      let preset = this.COMPRESSION_PRESETS.balanced;

      if (targetUseCase === 'document' || targetUseCase === 'receipt') {
        // Documents need higher quality for text readability
        preset = fileSizeKB > 1000 ? this.COMPRESSION_PRESETS.balanced : this.COMPRESSION_PRESETS.high_quality;
      } else if (width > 2000 || height > 2000 || fileSizeKB > 2000) {
        // Large images need more aggressive compression
        preset = this.COMPRESSION_PRESETS.mobile_optimized;
      } else if (fileSizeKB < 200) {
        // Small images can maintain higher quality
        preset = this.COMPRESSION_PRESETS.high_quality;
      }

      // Adjust quality based on original file size
      let adjustedQuality = preset.quality;
      if (fileSizeKB > 3000) {
        adjustedQuality = Math.max(0.6, preset.quality - 0.1);
      } else if (fileSizeKB < 500) {
        adjustedQuality = Math.min(0.95, preset.quality + 0.1);
      }

      return {
        ...preset,
        quality: adjustedQuality,
      };
    } catch (error) {
      console.error('Error analyzing image for compression:', error);
      // Fallback to balanced preset
      return this.COMPRESSION_PRESETS.balanced;
    }
  }

  /**
   * Compress image with progressive quality adjustment
   */
  async compressImage(
    imageUri: string,
    config?: Partial<CompressionConfig>,
    targetUseCase: 'document' | 'photo' | 'receipt' | 'general' = 'general'
  ): Promise<CompressionResult> {
    try {
      console.log('=== 🗜️ Starting Advanced Image Compression ===');
      console.log('📁 Input URI:', imageUri);
      console.log('🎯 Target use case:', targetUseCase);

      // Get original file info
      const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = originalFileInfo.size || 0;

      if (originalSize === 0) {
        throw new Error('Original image file is empty');
      }

      // Get optimal compression config
      const optimalConfig = await this.getOptimalCompressionConfig(imageUri, targetUseCase);
      const finalConfig = { ...optimalConfig, ...config };

      console.log('⚙️ Compression config:', finalConfig);

      // Prepare manipulation actions
      const actions: ImageManipulator.Action[] = [];

      // Add resize action if needed
      if (finalConfig.maxWidth || finalConfig.maxHeight) {
        actions.push({
          resize: {
            width: finalConfig.maxWidth,
            height: finalConfig.maxHeight,
          },
        });
      }

      // Determine output format
      const outputFormat = this.getOptimalFormat(imageUri, finalConfig.format);
      
      // First compression attempt
      let result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: finalConfig.quality,
          format: outputFormat,
          base64: false,
        }
      );

      // Progressive compression if target size is specified
      if (finalConfig.targetSizeKB) {
        result = await this.progressiveCompress(
          result.uri,
          finalConfig.targetSizeKB * 1024, // Convert to bytes
          finalConfig.quality,
          outputFormat
        );
      }

      // Get final file info
      const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);
      const compressedSize = compressedFileInfo.size || 0;

      if (compressedSize === 0) {
        throw new Error('Compressed image is empty');
      }

      // Calculate compression metrics
      const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;
      const compressionPercentage = Math.round(compressionRatio * 100);

      console.log('📊 Compression results:', {
        originalSize: `${Math.round(originalSize / 1024)}KB`,
        compressedSize: `${Math.round(compressedSize / 1024)}KB`,
        savings: `${compressionPercentage}%`,
        dimensions: `${result.width}x${result.height}`,
      });

      // Update compression stats
      this.updateCompressionStats(originalSize, compressedSize);

      const compressionResult: CompressionResult = {
        uri: result.uri,
        originalSize,
        compressedSize,
        compressionRatio,
        dimensions: { width: result.width, height: result.height },
        format: outputFormat,
      };

      console.log('=== ✅ Compression Complete ===');
      return compressionResult;
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      return {
        uri: imageUri, // Return original URI as fallback
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        dimensions: { width: 0, height: 0 },
        format: 'jpeg',
        error: error instanceof Error ? error.message : 'Compression failed',
      };
    }
  }

  /**
   * Progressive compression to reach target file size
   */
  private async progressiveCompress(
    imageUri: string,
    targetSizeBytes: number,
    initialQuality: number,
    format: ImageManipulator.SaveFormat
  ): Promise<{ uri: string; width: number; height: number }> {
    let currentUri = imageUri;
    let currentQuality = initialQuality;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const fileInfo = await FileSystem.getInfoAsync(currentUri);
      const currentSize = fileInfo.size || 0;

      console.log(`🔄 Progressive compression attempt ${attempts + 1}:`, {
        currentSize: `${Math.round(currentSize / 1024)}KB`,
        targetSize: `${Math.round(targetSizeBytes / 1024)}KB`,
        quality: currentQuality,
      });

      // If we've reached the target size, return current result
      if (currentSize <= targetSizeBytes || currentQuality <= 0.3) {
        break;
      }

      // Calculate quality reduction based on size difference
      const sizeRatio = currentSize / targetSizeBytes;
      const qualityReduction = Math.min(0.15, sizeRatio * 0.1);
      currentQuality = Math.max(0.3, currentQuality - qualityReduction);

      // Compress with new quality
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [],
        {
          compress: currentQuality,
          format,
          base64: false,
        }
      );

      // Clean up previous iteration (except original)
      if (currentUri !== imageUri) {
        try {
          await FileSystem.deleteAsync(currentUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn('Failed to cleanup intermediate file:', cleanupError);
        }
      }

      currentUri = result.uri;
      attempts++;
    }

    // Get final dimensions
    const finalResult = await ImageManipulator.manipulateAsync(currentUri, [], { base64: false });
    return finalResult;
  }

  /**
   * Determine optimal output format based on input image
   */
  private getOptimalFormat(imageUri: string, preferredFormat: string): ImageManipulator.SaveFormat {
    const extension = imageUri.toLowerCase().split('.').pop() || '';
    
    // Preserve PNG for images that likely have transparency
    if (extension === 'png' && preferredFormat !== 'jpeg') {
      return ImageManipulator.SaveFormat.PNG;
    }
    
    // Use WebP if supported and requested
    if (preferredFormat === 'webp' && Platform.OS !== 'web') {
      return ImageManipulator.SaveFormat.WEBP;
    }
    
    // Default to JPEG for photos (best compression)
    return ImageManipulator.SaveFormat.JPEG;
  }

  /**
   * Batch compress multiple images
   */
  async compressImageBatch(
    imageUris: string[],
    config?: Partial<CompressionConfig>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    console.log(`🗜️ Starting batch compression of ${imageUris.length} images`);

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      
      try {
        const result = await this.compressImage(uri, config);
        results.push(result);
        
        onProgress?.(i + 1, imageUris.length);
        
        console.log(`✅ Compressed ${i + 1}/${imageUris.length}: ${Math.round(result.compressionRatio * 100)}% reduction`);
      } catch (error) {
        console.error(`❌ Failed to compress image ${i + 1}:`, error);
        results.push({
          uri,
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          dimensions: { width: 0, height: 0 },
          format: 'jpeg',
          error: error instanceof Error ? error.message : 'Compression failed',
        });
      }
    }

    console.log('🎉 Batch compression complete');
    return results;
  }

  /**
   * Validate image before compression
   */
  async validateImageForCompression(imageUri: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        return { isValid: false, error: 'Image file does not exist' };
      }
      
      if (fileInfo.size === 0) {
        return { isValid: false, error: 'Image file is empty' };
      }
      
      // Check file size limits (max 50MB for processing)
      if (fileInfo.size > 50 * 1024 * 1024) {
        return { isValid: false, error: 'Image file is too large for processing (max 50MB)' };
      }

      // Try to get image dimensions to validate it's a valid image
      try {
        await ImageManipulator.manipulateAsync(imageUri, [], { base64: false });
      } catch (manipulatorError) {
        return { isValid: false, error: 'Invalid image format or corrupted file' };
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Image validation failed' 
      };
    }
  }

  /**
   * Get compression preset by name
   */
  getCompressionPreset(presetName: keyof typeof this.COMPRESSION_PRESETS): CompressionConfig {
    return { ...this.COMPRESSION_PRESETS[presetName] };
  }

  /**
   * Create custom compression config
   */
  createCompressionConfig(overrides: Partial<CompressionConfig>): CompressionConfig {
    return {
      ...this.COMPRESSION_PRESETS.balanced,
      ...overrides,
    };
  }

  /**
   * Update compression statistics
   */
  private updateCompressionStats(originalSize: number, compressedSize: number): void {
    this.compressionStats.totalOriginalSize += originalSize;
    this.compressionStats.totalCompressedSize += compressedSize;
    this.compressionStats.totalSavings = this.compressionStats.totalOriginalSize - this.compressionStats.totalCompressedSize;
    this.compressionStats.processedCount += 1;
    this.compressionStats.averageCompressionRatio = 
      this.compressionStats.totalSavings / this.compressionStats.totalOriginalSize;
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): CompressionStats & {
    totalSavingsMB: number;
    averageCompressionPercentage: number;
  } {
    return {
      ...this.compressionStats,
      totalSavingsMB: this.compressionStats.totalSavings / (1024 * 1024),
      averageCompressionPercentage: Math.round(this.compressionStats.averageCompressionRatio * 100),
    };
  }

  /**
   * Reset compression statistics
   */
  resetCompressionStats(): void {
    this.compressionStats = {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalSavings: 0,
      averageCompressionRatio: 0,
      processedCount: 0,
    };
  }

  /**
   * Estimate compression savings before processing
   */
  async estimateCompressionSavings(
    imageUri: string,
    config?: Partial<CompressionConfig>
  ): Promise<{
    estimatedSizeReduction: number;
    estimatedFinalSizeKB: number;
    recommendedPreset: keyof typeof this.COMPRESSION_PRESETS;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSizeKB = fileInfo.size ? fileInfo.size / 1024 : 0;
      
      // Get image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], { base64: false });
      const { width, height } = imageInfo;

      // Estimate compression based on image characteristics
      let estimatedReduction = 0.6; // Default 60% reduction
      let recommendedPreset: keyof typeof this.COMPRESSION_PRESETS = 'balanced';

      if (width > 2000 || height > 2000) {
        estimatedReduction = 0.8; // 80% reduction for large images
        recommendedPreset = 'mobile_optimized';
      } else if (originalSizeKB > 2000) {
        estimatedReduction = 0.75; // 75% reduction for large files
        recommendedPreset = 'mobile_optimized';
      } else if (originalSizeKB < 200) {
        estimatedReduction = 0.3; // 30% reduction for small files
        recommendedPreset = 'high_quality';
      }

      const estimatedFinalSizeKB = originalSizeKB * (1 - estimatedReduction);

      return {
        estimatedSizeReduction: Math.round(estimatedReduction * 100),
        estimatedFinalSizeKB: Math.round(estimatedFinalSizeKB),
        recommendedPreset,
      };
    } catch (error) {
      console.error('Error estimating compression savings:', error);
      return {
        estimatedSizeReduction: 60,
        estimatedFinalSizeKB: 300,
        recommendedPreset: 'balanced',
      };
    }
  }

  /**
   * Cleanup temporary files created during compression
   */
  async cleanupTemporaryFiles(uris: string[]): Promise<void> {
    for (const uri of uris) {
      try {
        if (uri.startsWith('file://')) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (error) {
        console.warn('Failed to cleanup temporary file:', uri, error);
      }
    }
  }
}

// Convenience instance
export const imageCompressionService = ImageCompressionService.getInstance();