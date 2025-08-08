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
  ZoomIn,
} from 'lucide-react-native';
import { AttendanceRecord } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  if (!attendance) return null;

  const buildPhotoItems = (): PhotoItem[] => {
    const photos: PhotoItem[] = [];

    if (attendance.selfieUrl) {
      photos.push({
        id: 'clock_in',
        type: 'clock_in',
        url: attendance.selfieUrl,
        timestamp: attendance.clockIn,
        title: 'Clock In',
        icon: <LogIn size={12} color="white" />,
        color: '#4CAF50',
      });
    }

    attendance.activities.forEach((activity) => {
      let photoUrl = activity.selfieUrl;
      if ((activity.type === 'break_start' || activity.type === 'break_end') && !photoUrl && activity.notes) {
        photoUrl = activity.notes;
      }

      if (photoUrl) {
        let title = '';
        let icon: React.ReactNode = null;
        let color = '';

        switch (activity.type) {
          case 'break_start':
            title = t('attendance.break_started');
            icon = <Coffee size={12} color="white" />;
            color = '#FF9800';
            break;
          case 'break_end':
            title = t('attendance.break_ended');
            icon = <Play size={12} color="white" />;
            color = '#E91E63';
            break;
          case 'clock_out':
            title = t('attendance.clock_out');
            icon = <LogOut size={12} color="white" />;
            color = '#F44336';
            break;
          case 'overtime_start':
            title = t('overtime.overtime_started');
            icon = <Clock size={12} color="white" />;
            color = '#9C27B0';
            break;
          case 'overtime_end':
            title = t('overtime.overtime_ended');
            icon = <Pause size={12} color="white" />;
            color = '#673AB7';
            break;
          case 'client_visit_start':
            title = t('client_visit.visit_started');
            icon = <MapPin size={12} color="white" />;
            color = '#2196F3';
            break;
          case 'client_visit_end':
            title = t('client_visit.visit_ended');
            icon = <MapPin size={12} color="white" />;
            color = '#1976D2';
            break;
          default:
            return;
        }

        photos.push({
          id: activity.id,
          type: activity.type as any,
          url: photoUrl,
          timestamp: activity.timestamp,
          title,
          icon,
          color,
        });
      }
    });

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

  const handlePhotoPress = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
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

  const renderFullscreenPhoto = () => {
    if (!selectedPhoto) return null;

    return (
      <View style={styles.fullscreenOverlay}>
        <View style={styles.fullscreenContent}>
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenTitle}>
              {selectedPhoto.title}
            </Text>
            <TouchableOpacity onPress={closePhotoModal}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Image 
            source={{ uri: selectedPhoto.url }} 
            style={styles.fullscreenImage}
            resizeMode="contain"
          />

          <View style={styles.fullscreenInfo}>
            <Text style={styles.fullscreenDate}>
              {formatDateTime(selectedPhoto.timestamp)}
            </Text>
            
            <View style={[
              styles.fullscreenTypeBadge,
              { backgroundColor: selectedPhoto.color }
            ]}>
              <Text style={styles.fullscreenTypeBadgeText}>
                {selectedPhoto.title}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.modalTitle}>{t('attendance.attendance_details')}</Text>
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
                  {attendance.status === 'completed' ? t('attendance.completed') : t('attendance.working')}
                </Text>
              </View>
            </View>

            {/* Time Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>{t('attendance.time_summary')}</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Clock size={20} color="#4A90E2" />
                  <Text style={styles.summaryLabel}>{t('attendance.work_hours')}</Text>
                  <Text style={styles.summaryValue}>{workHours}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Coffee size={20} color="#FF9800" />
                  <Text style={styles.summaryLabel}>{t('attendance.break_time')}</Text>
                  <Text style={styles.summaryValue}>
                    {Math.floor(attendance.breakTime / 60)}h {attendance.breakTime % 60}m
                  </Text>
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>{t('attendance.timeline')}</Text>
              
              {/* Clock In */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <LogIn size={20} color="#4CAF50" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{t('attendance.clock_in')}</Text>
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
                    <Text style={styles.timelineTitle}>{t('attendance.break_started')}</Text>
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
                    <Text style={styles.timelineTitle}>{t('attendance.break_ended')}</Text>
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
                    <Text style={styles.timelineTitle}>{t('attendance.clock_out')}</Text>
                    <Text style={styles.timelineTime}>{formatTime(attendance.clockOut)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Enhanced Photos Section */}
            {photoItems.length > 0 && (
              <View style={styles.photosSection}>
                <View style={styles.photosSectionHeader}>
                  <Text style={styles.sectionTitle}>{t('attendance.verification_photos')}</Text>
                  <View style={styles.photosCount}>
                    <Camera size={16} color="#4A90E2" />
                    <Text style={styles.photosCountText}>{photoItems.length} {t('attendance.photos')}</Text>
                  </View>
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.photosScrollView}
                  contentContainerStyle={styles.photosScrollContent}
                >
                  {photoItems.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.photoItem}
                      onPress={() => handlePhotoPress(photo)}
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
                            <Text style={styles.photoErrorText}>{t('attendance.failed_to_load')}</Text>
                            <TouchableOpacity
                              style={styles.retryButton}
                              onPress={() => {
                                setImageErrors(prev => ({ ...prev, [photo.id]: false }));
                                setImageLoading(prev => ({ ...prev, [photo.id]: true }));
                              }}
                            >
                              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
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
                        
                        <View style={styles.photoOverlay}>
                          <View style={[styles.photoTypeBadge, { backgroundColor: photo.color }]}>
                            <View style={styles.iconContainer}>
                              {photo.icon}
                            </View>
                            <Text style={styles.photoTypeText}>{photo.title}</Text>
                          </View>
                          <Text style={styles.photoTime}>
                            {formatTime(photo.timestamp)}
                          </Text>
                          
                          <View style={styles.tapToViewIndicator}>
                            <ZoomIn size={12} color="rgba(255, 255, 255, 0.8)" />
                            <Text style={styles.tapToViewText}>{t('attendance.tap_to_view')}</Text>
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
              <Text style={styles.sectionTitle}>{t('attendance.location_information')}</Text>
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
                <Text style={styles.sectionTitle}>{t('attendance.notes')}</Text>
                <View style={styles.notesCard}>
                  <Text style={styles.notesText}>{attendance.notes}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Render fullscreen photo overlay here */}
        {renderFullscreenPhoto()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
    overflow: 'hidden', // Ensures fullscreen overlay is contained if not positioned absolutely
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
  // Styles for the fullscreen photo overlay VIEW
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Ensure it's on top
  },
  fullscreenContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'black',
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  fullscreenImage: {
    flex: 1,
    width: '100%',
  },
  fullscreenInfo: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  fullscreenDate: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  fullscreenTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fullscreenTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  iconContainer: {
    marginRight: 4, // Add some spacing between icon and text
    alignItems: 'center', // Center icon vertically
    justifyContent: 'center', // Center icon horizontally
  },
});