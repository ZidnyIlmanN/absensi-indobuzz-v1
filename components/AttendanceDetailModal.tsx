import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  X,
  Clock,
  MapPin,
  Calendar,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Pause,
  Camera,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Download,
  Share,
} from 'lucide-react-native';
import { AttendanceRecord, ActivityRecord } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';

const { width, height } = Dimensions.get('window');

interface AttendanceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  attendance: AttendanceRecord | null;
  workHours: string;
}

interface PhotoItem {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  url: string;
  timestamp: Date;
  title: string;
  icon: React.ReactNode;
  color: string;
}

export function AttendanceDetailModal({
  visible,
  onClose,
  attendance,
  workHours,
}: AttendanceDetailModalProps) {
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoItem | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [zoomScale, setZoomScale] = useState(1);

  if (!attendance) return null;

  // Build comprehensive photo items from attendance record and activities
  const buildPhotoItems = (): PhotoItem[] => {
    const photos: PhotoItem[] = [];

    // Clock in photo (from main attendance record)
    if (attendance.selfieUrl) {
      photos.push({
        id: 'clock_in',
        type: 'clock_in',
        url: attendance.selfieUrl,
        timestamp: attendance.clockIn,
        title: 'Clock In',
        icon: <LogIn size={16} color="#4CAF50" />,
        color: '#4CAF50',
      });
    }

    // Activity photos (break start, break end, etc.)
    attendance.activities.forEach((activity) => {
      if (activity.selfieUrl) {
        let title = '';
        let icon: React.ReactNode = null;
        let color = '';

        switch (activity.type) {
          case 'break_start':
            title = 'Break Started';
            icon = <Coffee size={16} color="#FF9800" />;
            color = '#FF9800';
            break;
          case 'break_end':
            title = 'Break Ended';
            icon = <Play size={16} color="#E91E63" />;
            color = '#E91E63';
            break;
          case 'clock_out':
            title = 'Clock Out';
            icon = <LogOut size={16} color="#F44336" />;
            color = '#F44336';
            break;
          case 'overtime_start':
            title = 'Overtime Started';
            icon = <Clock size={16} color="#9C27B0" />;
            color = '#9C27B0';
            break;
          case 'overtime_end':
            title = 'Overtime Ended';
            icon = <Pause size={16} color="#673AB7" />;
            color = '#673AB7';
            break;
          case 'client_visit_start':
            title = 'Client Visit Started';
            icon = <MapPin size={16} color="#2196F3" />;
            color = '#2196F3';
            break;
          case 'client_visit_end':
            title = 'Client Visit Ended';
            icon = <MapPin size={16} color="#1976D2" />;
            color = '#1976D2';
            break;
          default:
            return; // Skip unknown activity types
        }

        photos.push({
          id: activity.id,
          type: activity.type as any,
          url: activity.selfieUrl,
          timestamp: activity.timestamp,
          title,
          icon,
          color,
        });
      }
    });

    // Sort photos by timestamp (chronological order)
    return photos.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const photoItems = buildPhotoItems();

  const handleImageLoad = (photoId: string) => {
    setImageLoading(prev => ({ ...prev, [photoId]: false }));
  };

  const handleImageError = (photoId: string) => {
    setImageLoading(prev => ({ ...prev, [photoId]: false }));
    setImageErrors(prev => ({ ...prev, [photoId]: true }));
    
    const photo = photoItems.find(p => p.id === photoId);
    if (photo) {
      console.warn(`Failed to load photo: ${photo.title} | URL: ${photo.url}`);
    }
  };

  const handleImageLoadStart = (photoId: string) => {
    setImageLoading(prev => ({ ...prev, [photoId]: true }));
    setImageErrors(prev => ({ ...prev, [photoId]: false }));
  };

  const openFullscreen = (photo: PhotoItem) => {
    const index = photoItems.findIndex(p => p.id === photo.id);
    setCurrentPhotoIndex(index);
    setFullscreenPhoto(photo);
    setZoomScale(1);
  };

  const closeFullscreen = () => {
    setFullscreenPhoto(null);
    setZoomScale(1);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (photoItems.length === 0) return;

    let newIndex = currentPhotoIndex;
    if (direction === 'prev') {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photoItems.length - 1;
    } else {
      newIndex = currentPhotoIndex < photoItems.length - 1 ? currentPhotoIndex + 1 : 0;
    }

    setCurrentPhotoIndex(newIndex);
    setFullscreenPhoto(photoItems[newIndex]);
    setZoomScale(1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const getBreakTimes = () => {
    const breakStart = attendance.activities.find(act => act.type === 'break_start');
    const breakEnd = attendance.activities.find(act => act.type === 'break_end');
    return {
      breakStarted: breakStart ? formatTime(breakStart.timestamp) : '-',
      breakEnded: breakEnd ? formatTime(breakEnd.timestamp) : '-',
    };
  };

  const { breakStarted, breakEnded } = getBreakTimes();

  return (
    <>
      {/* Main Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerInfo}>
                <Text style={styles.modalTitle}>Attendance Details</Text>
                <Text style={styles.modalDate}>{formatDate(attendance.clockIn)}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Status Badge */}
              <View style={styles.statusSection}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: attendance.status === 'completed' ? '#4CAF50' : '#4A90E2' }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {attendance.status === 'completed' ? 'Completed' : 'Working'}
                  </Text>
                </View>
              </View>

              {/* Time Summary */}
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Time Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Clock size={20} color="#4A90E2" />
                    <Text style={styles.summaryLabel}>Work Hours</Text>
                    <Text style={styles.summaryValue}>{workHours}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Coffee size={20} color="#FF9800" />
                    <Text style={styles.summaryLabel}>Break Time</Text>
                    <Text style={styles.summaryValue}>
                      {Math.floor(attendance.breakTime / 60)}h {attendance.breakTime % 60}m
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timeline */}
              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                
                {/* Clock In */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    <LogIn size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Clock In</Text>
                    <Text style={styles.timelineTime}>{formatTime(attendance.clockIn)}</Text>
                    <Text style={styles.timelineLocation}>{attendance.location.address}</Text>
                  </View>
                </View>

                {/* Break Start */}
                {breakStarted !== '-' && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIcon}>
                      <Coffee size={20} color="#FF9800" />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Break Started</Text>
                      <Text style={styles.timelineTime}>{breakStarted}</Text>
                    </View>
                  </View>
                )}

                {/* Break End */}
                {breakEnded !== '-' && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIcon}>
                      <Play size={20} color="#E91E63" />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Break Ended</Text>
                      <Text style={styles.timelineTime}>{breakEnded}</Text>
                    </View>
                  </View>
                )}

                {/* Clock Out */}
                {attendance.clockOut && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIcon}>
                      <LogOut size={20} color="#F44336" />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Clock Out</Text>
                      <Text style={styles.timelineTime}>{formatTime(attendance.clockOut)}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Enhanced Photos Section */}
              {photoItems.length > 0 && (
                <View style={styles.photosSection}>
                  <View style={styles.photosSectionHeader}>
                    <Text style={styles.sectionTitle}>Verification Photos</Text>
                    <View style={styles.photosCount}>
                      <Camera size={16} color="#4A90E2" />
                      <Text style={styles.photosCountText}>{photoItems.length} photos</Text>
                    </View>
                  </View>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.photosScrollView}
                    contentContainerStyle={styles.photosScrollContent}
                  >
                    {photoItems.map((photo, index) => (
                      <TouchableOpacity
                        key={photo.id}
                        style={styles.photoItem}
                        onPress={() => openFullscreen(photo)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.photoContainer}>
                          {imageLoading[photo.id] && (
                            <View style={styles.photoLoading}>
                              <LoadingSpinner size="small" color="#4A90E2" />
                            </View>
                          )}
                          
                          {imageErrors[photo.id] ? (
                            <View style={styles.photoError}>
                              <Camera size={24} color="#E0E0E0" />
                              <Text style={styles.photoErrorText}>Failed to load</Text>
                              <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                  setImageErrors(prev => ({ ...prev, [photo.id]: false }));
                                  setImageLoading(prev => ({ ...prev, [photo.id]: true }));
                                }}
                              >
                                <Text style={styles.retryButtonText}>Retry</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Image
                              source={{ uri: photo.url }}
                              style={styles.photoImage}
                              onLoadStart={() => handleImageLoadStart(photo.id)}
                              onLoad={() => handleImageLoad(photo.id)}
                              onError={() => handleImageError(photo.id)}
                            />
                          )}
                          
                          {/* Photo Overlay with Enhanced Info */}
                          <View style={styles.photoOverlay}>
                            <View style={[styles.photoTypeBadge, { backgroundColor: photo.color }]}>
                              {photo.icon}
                              <Text style={styles.photoTypeText}>{photo.title}</Text>
                            </View>
                            <Text style={styles.photoTime}>
                              {formatTime(photo.timestamp)}
                            </Text>
                            
                            {/* Tap to view indicator */}
                            <View style={styles.tapToViewIndicator}>
                              <ZoomIn size={12} color="rgba(255, 255, 255, 0.8)" />
                              <Text style={styles.tapToViewText}>Tap to view</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Location Information */}
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>Location Information</Text>
                <View style={styles.locationCard}>
                  <MapPin size={20} color="#4A90E2" />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationAddress}>{attendance.location.address}</Text>
                    <Text style={styles.locationCoords}>
                      {attendance.location.latitude.toFixed(6)}, {attendance.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Notes Section */}
              {attendance.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>{attendance.notes}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Enhanced Fullscreen Photo Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!fullscreenPhoto}
        onRequestClose={closeFullscreen}
        statusBarTranslucent={true}
      >
        <View style={styles.fullscreenOverlay}>
          {fullscreenPhoto && (
            <>
              {/* Enhanced Header */}
              <View style={styles.fullscreenHeader}>
                <View style={styles.fullscreenHeaderLeft}>
                  <View style={[styles.fullscreenTypeBadge, { backgroundColor: fullscreenPhoto.color }]}>
                    {fullscreenPhoto.icon}
                    <Text style={styles.fullscreenTypeText}>{fullscreenPhoto.title}</Text>
                  </View>
                  <Text style={styles.fullscreenTime}>
                    {formatDateTime(fullscreenPhoto.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.fullscreenHeaderRight}>
                  <TouchableOpacity style={styles.fullscreenActionButton}>
                    <Share size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.fullscreenActionButton}>
                    <Download size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeFullscreen}
                    style={styles.fullscreenCloseButton}
                  >
                    <X size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Enhanced Photo Container with Pinch-to-Zoom */}
              <View style={styles.fullscreenImageContainer}>
                <ScrollView
                  style={styles.zoomContainer}
                  contentContainerStyle={styles.zoomContent}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  bouncesZoom={true}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  pinchGestureEnabled={true}
                  onScroll={(event) => {
                    const { zoomScale } = event.nativeEvent;
                    setZoomScale(zoomScale);
                  }}
                  scrollEventThrottle={16}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      // Double tap to reset zoom (simplified)
                      if (zoomScale > 1) {
                        setZoomScale(1);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: fullscreenPhoto.url }}
                      style={styles.fullscreenImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Enhanced Navigation */}
              {photoItems.length > 1 && (
                <View style={styles.fullscreenNavigation}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigatePhoto('prev')}
                  >
                    <ChevronLeft size={28} color="white" />
                  </TouchableOpacity>

                  <View style={styles.photoCounter}>
                    <Text style={styles.photoCounterText}>
                      {currentPhotoIndex + 1} of {photoItems.length}
                    </Text>
                    <View style={styles.photoIndicators}>
                      {photoItems.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.photoIndicator,
                            index === currentPhotoIndex && styles.activePhotoIndicator
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigatePhoto('next')}
                  >
                    <ChevronRight size={28} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Enhanced Photo Info */}
              <View style={styles.fullscreenInfo}>
                <Text style={styles.fullscreenInfoText}>
                  {formatDateTime(fullscreenPhoto.timestamp)}
                </Text>
                <Text style={styles.fullscreenLocationText}>
                  Pinch to zoom • Double tap to reset • Swipe to navigate
                </Text>
                {zoomScale > 1 && (
                  <Text style={styles.zoomIndicator}>
                    Zoom: {zoomScale.toFixed(1)}x
                  </Text>
                )}
              </View>

              {/* Thumbnail Strip for Quick Navigation */}
              {photoItems.length > 1 && (
                <View style={styles.thumbnailStrip}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnailContainer}
                  >
                    {photoItems.map((photo, index) => (
                      <TouchableOpacity
                        key={`thumb-${photo.id}`}
                        style={[
                          styles.thumbnail,
                          index === currentPhotoIndex && styles.activeThumbnail
                        ]}
                        onPress={() => {
                          setCurrentPhotoIndex(index);
                          setFullscreenPhoto(photo);
                          setZoomScale(1);
                        }}
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
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 12,
    color: '#999',
  },
  photosSection: {
    marginBottom: 24,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photosCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photosCountText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 6,
    fontWeight: '500',
  },
  photosScrollView: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  photosScrollContent: {
    paddingHorizontal: 20,
  },
  photoItem: {
    width: 120,
    height: 120,
    marginRight: 12,
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoError: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  photoErrorText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '500',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
  },
  photoTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  photoTypeText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  photoTime: {
    fontSize: 10,
    color: 'white',
    marginBottom: 4,
  },
  tapToViewIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  tapToViewText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridPhotoItem: {
    width: (width - 60) / 2, // 2 photos per row
    height: 140,
  },
  gridPhotoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  gridPhotoImage: {
    width: '100%',
    height: '100%',
  },
  gridPhotoLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPhotoError: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
  },
  gridPhotoTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  gridPhotoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  gridPhotoTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationSection: {
    marginBottom: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  fullscreenHeaderLeft: {
    flex: 1,
  },
  fullscreenTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  fullscreenTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  fullscreenTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fullscreenHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullscreenActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fullscreenCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    flex: 1,
    width: '100%',
  },
  zoomContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullscreenImage: {
    width: width - 40,
    height: height * 0.6,
    borderRadius: 12,
  },
  fullscreenNavigation: {
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
    alignItems: 'center',
  },
  photoCounterText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    marginBottom: 8,
  },
  photoIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activePhotoIndicator: {
    backgroundColor: 'white',
  },
  fullscreenInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fullscreenInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 4,
  },
  fullscreenLocationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  zoomIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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