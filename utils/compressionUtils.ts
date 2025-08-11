import { imageCompressionService } from '@/services/imageCompressionService';
import { leaveAttachmentService } from '@/services/leaveAttachmentService';

/**
 * Utility functions for image compression operations
 */

/**
 * Estimate storage savings for a batch of images
 */
export const estimateBatchCompressionSavings = async (
  imageUris: string[]
): Promise<{
  totalEstimatedSavingsKB: number;
  totalEstimatedSavingsPercentage: number;
  individualEstimates: Array<{
    uri: string;
    estimatedSizeReduction: number;
    estimatedFinalSizeKB: number;
    recommendedPreset: string;
  }>;
}> => {
  const estimates = [];
  let totalOriginalSizeKB = 0;
  let totalEstimatedFinalSizeKB = 0;

  for (const uri of imageUris) {
    try {
      const estimate = await imageCompressionService.estimateCompressionSavings(uri);
      estimates.push({
        uri,
        ...estimate,
      });

      // Calculate sizes for totals (rough estimation)
      const originalSizeKB = 1000; // Placeholder - would need actual file size
      const finalSizeKB = estimate.estimatedFinalSizeKB;
      
      totalOriginalSizeKB += originalSizeKB;
      totalEstimatedFinalSizeKB += finalSizeKB;
    } catch (error) {
      console.error('Error estimating compression for:', uri, error);
    }
  }

  const totalSavingsKB = totalOriginalSizeKB - totalEstimatedFinalSizeKB;
  const totalSavingsPercentage = totalOriginalSizeKB > 0 
    ? Math.round((totalSavingsKB / totalOriginalSizeKB) * 100)
    : 0;

  return {
    totalEstimatedSavingsKB: totalSavingsKB,
    totalEstimatedSavingsPercentage: totalSavingsPercentage,
    individualEstimates: estimates,
  };
};

/**
 * Get optimal compression preset based on file characteristics
 */
export const getOptimalCompressionPreset = (
  fileSizeKB: number,
  dimensions: { width: number; height: number },
  fileType: 'document' | 'photo' | 'receipt' | 'general' = 'general'
): 'high_quality' | 'balanced' | 'mobile_optimized' | 'thumbnail' => {
  const { width, height } = dimensions;
  const isLargeImage = width > 2000 || height > 2000;
  const isLargeFile = fileSizeKB > 2000;
  const isSmallFile = fileSizeKB < 200;

  // Document/receipt priority: maintain quality for text readability
  if (fileType === 'document' || fileType === 'receipt') {
    if (isLargeFile) return 'balanced';
    return 'high_quality';
  }

  // Photo optimization
  if (fileType === 'photo') {
    if (isLargeImage || isLargeFile) return 'mobile_optimized';
    if (isSmallFile) return 'high_quality';
    return 'balanced';
  }

  // General files
  if (isLargeImage || isLargeFile) return 'mobile_optimized';
  if (isSmallFile) return 'high_quality';
  return 'balanced';
};

/**
 * Calculate potential storage cost savings
 */
export const calculateStorageCostSavings = (
  totalSavingsKB: number,
  costPerGBPerMonth: number = 0.023 // AWS S3 standard pricing
): {
  monthlySavings: number;
  yearlySavings: number;
  formattedMonthlySavings: string;
  formattedYearlySavings: string;
} => {
  const savingsGB = totalSavingsKB / (1024 * 1024);
  const monthlySavings = savingsGB * costPerGBPerMonth;
  const yearlySavings = monthlySavings * 12;

  return {
    monthlySavings,
    yearlySavings,
    formattedMonthlySavings: `$${monthlySavings.toFixed(2)}`,
    formattedYearlySavings: `$${yearlySavings.toFixed(2)}`,
  };
};

/**
 * Validate image compression requirements
 */
export const validateCompressionRequirements = async (
  imageUri: string
): Promise<{
  needsCompression: boolean;
  reason: string;
  recommendedAction: string;
}> => {
  try {
    const validation = await imageCompressionService.validateImageForCompression(imageUri);
    
    if (!validation.isValid) {
      return {
        needsCompression: false,
        reason: validation.error || 'Invalid image',
        recommendedAction: 'Fix image issues before upload',
      };
    }

    const estimate = await imageCompressionService.estimateCompressionSavings(imageUri);
    
    if (estimate.estimatedSizeReduction < 20) {
      return {
        needsCompression: false,
        reason: 'Image is already optimized',
        recommendedAction: 'Upload without compression',
      };
    }

    return {
      needsCompression: true,
      reason: `Can reduce size by ${estimate.estimatedSizeReduction}%`,
      recommendedAction: `Use ${estimate.recommendedPreset} preset`,
    };
  } catch (error) {
    return {
      needsCompression: false,
      reason: 'Unable to analyze image',
      recommendedAction: 'Upload with default compression',
    };
  }
};

/**
 * Format compression statistics for display
 */
export const formatCompressionStats = (stats: any): {
  formattedTotalSavings: string;
  formattedAverageCompression: string;
  formattedProcessedCount: string;
  efficiencyRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
} => {
  const totalSavingsMB = stats.totalSavingsMB || 0;
  const averageCompression = stats.averageCompressionPercentage || 0;
  const processedCount = stats.processedCount || 0;

  // Determine efficiency rating
  let efficiencyRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor';
  if (averageCompression >= 70) efficiencyRating = 'Excellent';
  else if (averageCompression >= 50) efficiencyRating = 'Good';
  else if (averageCompression >= 30) efficiencyRating = 'Fair';

  return {
    formattedTotalSavings: totalSavingsMB >= 1 
      ? `${totalSavingsMB.toFixed(1)} MB`
      : `${Math.round(totalSavingsMB * 1024)} KB`,
    formattedAverageCompression: `${averageCompression}%`,
    formattedProcessedCount: processedCount.toLocaleString(),
    efficiencyRating,
  };
};

/**
 * Get compression recommendations for different scenarios
 */
export const getCompressionRecommendations = (
  scenario: 'leave_request' | 'receipt' | 'document' | 'photo'
): {
  recommendedPreset: string;
  description: string;
  expectedSavings: string;
  qualityImpact: string;
} => {
  const recommendations = {
    leave_request: {
      recommendedPreset: 'balanced',
      description: 'Optimized for document readability and reasonable file sizes',
      expectedSavings: '60-75%',
      qualityImpact: 'Minimal - text remains clear and readable',
    },
    receipt: {
      recommendedPreset: 'high_quality',
      description: 'Maintains high quality for receipt details and text',
      expectedSavings: '40-60%',
      qualityImpact: 'Very minimal - all details preserved',
    },
    document: {
      recommendedPreset: 'high_quality',
      description: 'Preserves text clarity and document details',
      expectedSavings: '50-70%',
      qualityImpact: 'Minimal - optimized for text readability',
    },
    photo: {
      recommendedPreset: 'mobile_optimized',
      description: 'Optimized for mobile viewing and sharing',
      expectedSavings: '70-85%',
      qualityImpact: 'Slight - optimized for screen viewing',
    },
  };

  return recommendations[scenario];
};

/**
 * Compression health check
 */
export const performCompressionHealthCheck = async (): Promise<{
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check compression service availability
    const testConfig = imageCompressionService.getCompressionPreset('balanced');
    if (!testConfig) {
      issues.push('Compression presets not available');
    }

    // Check storage service
    const stats = imageCompressionService.getCompressionStats();
    if (stats.processedCount === 0) {
      recommendations.push('No images have been compressed yet');
    }

    // Check average compression efficiency
    if (stats.averageCompressionPercentage < 30) {
      issues.push('Low compression efficiency detected');
      recommendations.push('Review compression settings and image types');
    }

    const status = issues.length === 0 ? 'healthy' : 'warning';

    return {
      status,
      issues,
      recommendations,
    };
  } catch (error) {
    return {
      status: 'error',
      issues: ['Compression system error'],
      recommendations: ['Check system logs and restart if necessary'],
    };
  }
};