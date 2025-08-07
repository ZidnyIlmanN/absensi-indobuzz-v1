import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share,
  Camera,
} from 'lucide-react-native';
import { LoadingSpinner } from './LoadingSpinner';

const { width, height } = Dimensions.get('window');

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  timestamp: Date;
  type: string;
  icon: React.ReactNode;
  color: string;
}

interface PhotoGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  initialIndex?: number;
}

export function PhotoGalleryModal({
  visible,
  onClose,
  photos,
  initialIndex = 0,
}: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setImageLoading(true);
      setImageError(false);
    }
  }, [visible, initialIndex]);

  const currentPhoto = photos[currentIndex];

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (photos.length === 0) return;

    let newIndex = currentIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    }

    setCurrentIndex(newIndex);
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!visible || !currentPhoto) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeBadge, { backgroundColor: currentPhoto.color }]}>
              {currentPhoto.icon}
              <Text style={styles.typeText}>{currentPhoto.title}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Share size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Download size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" color="white" />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}

          {imageError ? (
            <View style={styles.errorContainer}>
              <Camera size={64} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.errorText}>Failed to load image</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setImageError(false);
                  setImageLoading(true);
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: currentPhoto.url }}
              style={styles.fullscreenImage}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </View>

        {/* Navigation */}
        {photos.length > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigatePhoto('prev')}
            >
              <ChevronLeft size={28} color="white" />
            </TouchableOpacity>

            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {currentIndex + 1} of {photos.length}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigatePhoto('next')}
            >
              <ChevronRight size={28} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Photo Info */}
        <View style={styles.photoInfo}>
          <Text style={styles.photoInfoText}>
            {formatDateTime(currentPhoto.timestamp)}
          </Text>
        </View>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <View style={styles.thumbnailStrip}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.thumbnail,
                    index === currentIndex && styles.activeThumbnail
                  ]}
                  onPress={() => setCurrentIndex(index)}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.thumbnailImage}
                  />
                  <View style={[styles.thumbnailBadge, { backgroundColor: photo.color }]}>
                    {photo.icon}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  fullscreenImage: {
    width: width - 40,
    height: height * 0.6,
    borderRadius: 12,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  photoCounterText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  photoInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photoInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  thumbnailStrip: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 16,
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  activeThumbnail: {
    borderColor: 'white',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});