import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  File,
  X,
  ZoomIn,
} from 'lucide-react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { imageCompressionService } from '@/services/imageCompressionService';

const { width } = Dimensions.get('window');
const previewImageSize = (width - 80) / 3; // 3 images per row with padding

interface AttachmentPreviewProps {
  attachments: string[];
  title?: string;
  maxPreviewImages?: number;
  showDownloadButton?: boolean;
  onDownload?: (url: string, index: number) => void;
  showCompressionInfo?: boolean;
}

export function AttachmentPreview({
  attachments,
  title = 'Attachments',
  maxPreviewImages = 6,
  showDownloadButton = true,
  onDownload,
  showCompressionInfo = false,
}: AttachmentPreviewProps) {
  const { t } = useTranslation();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [compressionStats, setCompressionStats] = useState<any>(null);

  // Load compression stats if requested
  useEffect(() => {
    if (showCompressionInfo) {
      const stats = imageCompressionService.getCompressionStats();
      setCompressionStats(stats);
    }
  }, [showCompressionInfo]);
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const isImage = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext)) || urlLower.includes('image');
  };

  const getFileType = (url: string): 'image' | 'pdf' | 'document' | 'unknown' => {
    const urlLower = url.toLowerCase();
    
    if (isImage(url)) return 'image';
    if (urlLower.includes('.pdf') || urlLower.includes('pdf')) return 'pdf';
    if (urlLower.includes('.doc') || urlLower.includes('.txt')) return 'document';
    return 'unknown';
  };

  const getFileIcon = (url: string) => {
    const type = getFileType(url);
    const iconProps = { size: 24, color: '#4A90E2' };
    
    switch (type) {
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'pdf':
        return <FileText {...iconProps} color="#F44336" />;
      case 'document':
        return <FileText {...iconProps} color="#4CAF50" />;
      default:
        return <File {...iconProps} color="#666" />;
    }
  };

  const handleImageLoad = (url: string) => {
    setImageLoading(prev => ({ ...prev, [url]: false }));
    setImageErrors(prev => ({ ...prev, [url]: false }));
  };

  const handleImageError = (url: string) => {
    setImageLoading(prev => ({ ...prev, [url]: false }));
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  const handleImageLoadStart = (url: string) => {
    setImageLoading(prev => ({ ...prev, [url]: true }));
    setImageErrors(prev => ({ ...prev, [url]: false }));
  };

  const handleDownload = (url: string, index: number) => {
    if (onDownload) {
      onDownload(url, index);
    } else {
      Alert.alert(
        t('common.download'),
        'Download functionality would be implemented here.',
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleImagePreview = (url: string) => {
    if (expandedImage === url) {
      setExpandedImage(null);
    } else {
      setExpandedImage(url);
    }
  };

  const images = attachments.filter(isImage);
  const documents = attachments.filter(url => !isImage(url));
  const displayImages = isExpanded ? images : images.slice(0, maxPreviewImages);
  const hasMoreImages = images.length > maxPreviewImages;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {title} ({attachments.length})
        </Text>
        {showCompressionInfo && compressionStats && compressionStats.processedCount > 0 && (
          <View style={styles.compressionBadge}>
            <Text style={styles.compressionBadgeText}>
              {compressionStats.averageCompressionPercentage}% compressed
            </Text>
          </View>
        )}
        {hasMoreImages && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? t('common.show_less') : t('common.show_more')}
            </Text>
            {isExpanded ? (
              <ChevronUp size={16} color="#4A90E2" />
            ) : (
              <ChevronDown size={16} color="#4A90E2" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Compression Info */}
      {showCompressionInfo && compressionStats && compressionStats.processedCount > 0 && (
        <View style={styles.compressionInfo}>
          <Text style={styles.compressionInfoText}>
            💾 Storage optimized: {compressionStats.totalSavingsMB.toFixed(1)}MB saved through automatic compression
          </Text>
        </View>
      )}
      {/* Images Grid */}
      {images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('leave_request.images')} ({images.length})
          </Text>
          
          <View style={styles.imagesGrid}>
            {displayImages.map((url, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imagePreviewItem}
                onPress={() => handleImagePreview(url)}
                activeOpacity={0.8}
              >
                <View style={styles.imageContainer}>
                  {imageLoading[url] && (
                    <View style={styles.imageLoading}>
                      <LoadingSpinner size="small" color="#4A90E2" />
                    </View>
                  )}
                  
                  {imageErrors[url] ? (
                    <View style={styles.imageError}>
                      <ImageIcon size={24} color="#E0E0E0" />
                      <Text style={styles.imageErrorText}>{t('common.failed_to_load')}</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: url }}
                      style={styles.previewImage}
                      onLoadStart={() => handleImageLoadStart(url)}
                      onLoad={() => handleImageLoad(url)}
                      onError={() => handleImageError(url)}
                    />
                  )}
                  
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity
                      style={styles.imageAction}
                      onPress={() => handleImagePreview(url)}
                    >
                      <ZoomIn size={16} color="white" />
                    </TouchableOpacity>
                    
                    {showDownloadButton && (
                      <TouchableOpacity
                        style={styles.imageAction}
                        onPress={() => handleDownload(url, index)}
                      >
                        <Download size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Expanded Image View */}
          {expandedImage && (
            <View style={styles.expandedImageContainer}>
              <View style={styles.expandedImageHeader}>
                <Text style={styles.expandedImageTitle}>{t('leave_request.image_preview')}</Text>
                <TouchableOpacity
                  style={styles.closeExpandedButton}
                  onPress={() => setExpandedImage(null)}
                >
                  <X size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.expandedImageWrapper}>
                <Image
                  source={{ uri: expandedImage }}
                  style={styles.expandedImage}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.expandedImageActions}>
                {showDownloadButton && (
                  <TouchableOpacity
                    style={styles.expandedImageAction}
                    onPress={() => {
                      const index = images.indexOf(expandedImage);
                      handleDownload(expandedImage, index);
                    }}
                  >
                    <Download size={16} color="#4A90E2" />
                    <Text style={styles.expandedImageActionText}>{t('common.download')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('leave_request.documents')} ({documents.length})
          </Text>
          
          <View style={styles.documentsList}>
            {documents.map((url, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentItem}
                onPress={() => handleDownload(url, images.length + index)}
                activeOpacity={0.7}
              >
                <View style={styles.documentIcon}>
                  {getFileIcon(url)}
                </View>
                
                <View style={styles.documentContent}>
                  <Text style={styles.documentName}>
                    {t('leave_request.document')} {index + 1}
                  </Text>
                  <Text style={styles.documentType}>
                    {getFileType(url).toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={styles.documentAction}
                    onPress={() => handleDownload(url, images.length + index)}
                  >
                    <Download size={16} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  compressionBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  compressionBadgeText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    marginRight: 4,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imagePreviewItem: {
    width: previewImageSize,
    height: previewImageSize,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imageError: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imageErrorText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  imageAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  expandedImageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedImageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeExpandedButton: {
    padding: 4,
  },
  expandedImageWrapper: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  expandedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  expandedImageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  expandedImageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expandedImageActionText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 6,
    fontWeight: '500',
  },
  documentsList: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#666',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  documentAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressionInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  compressionInfoText: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
  },
});