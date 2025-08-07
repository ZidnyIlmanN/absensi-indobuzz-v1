import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  Camera, 
  X,
  ImageIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

const { width, height } = Dimensions.get('window');

interface AttendancePhoto {
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  url: string;
  timestamp: Date;
  label: string;
}

export default function AttendanceHistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { attendanceId } = useLocalSearchParams();
  const { attendanceHistory, currentAttendance, todayActivities } = useAppContext();
  
  const [selectedPhoto, setSelectedPhoto] = useState<AttendancePhoto | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Find the attendance record
  const attendanceRecord = attendanceHistory.find(record => record.id === attendanceId) || 
    (currentAttendance?.id === attendanceId ? currentAttendance : null);

  useEffect(() => {
    if (!attendanceRecord) {
      Alert.alert('Error', 'Attendance record not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [attendanceRecord]);

  if (!attendanceRecord) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Loading attendance details..." />
      </View>
    );
  }

  // Get activities for this attendance record
  const recordActivities = attendanceRecord.id === currentAttendance?.id 
    ? todayActivities 
    : attendanceRecord.activities || [];

  // Build photos array from attendance record and activities
  const buildPhotosArray = (): AttendancePhoto[] => {
    const photos: AttendancePhoto[] = [];

    // Clock in photo from main attendance record
    if (attendanceRecord.selfieUrl) {
      photos.push({
        type: 'clock_in',
        url: attendanceRecord.selfieUrl,
        timestamp: attendanceRecord.clockIn,
        label: 'Clock In Photo',
      });
    }

    // Photos from activities
    recordActivities.forEach(activity => {
      if (activity.selfieUrl) {
        let label = '';
        switch (activity.type) {
          case 'break_start':
            label = 'Break Start Photo';
            break;
          case 'break_end':
            label = 'Break End Photo';
            break;
          case 'clock_out':
            label = 'Clock Out Photo';
            break;
          default:
            label = `${activity.type} Photo`;
        }

        photos.push({
          type: activity.type as any,
          url: activity.selfieUrl,
          timestamp: activity.timestamp,
          label,
        });
      }
    });

    // Sort photos by timestamp
    return photos.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const photos = buildPhotosArray();

  const handlePhotoPress = (photo: AttendancePhoto) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const getPhotoIcon = (type: string) => {
    switch (type) {
      case 'clock_in':
        return <LogIn size={16} color="#4CAF50" />;
      case 'clock_out':
        return <LogOut size={16} color="#F44336" />;
      case 'break_start':
      case 'break_end':
        return <Coffee size={16} color="#FF9800" />;
      default:
        return <Camera size={16} color="#666" />;
    }
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'clock_in':
        return '#E8F5E8';
      case 'clock_out':
        return '#FFEBEE';
      case 'break_start':
      case 'break_end':
        return '#FFF3E0';
      default:
        return '#F8F9FA';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateWorkHours = () => {
    if (!attendanceRecord.clockIn) return '00:00';
    
    const endTime = attendanceRecord.clockOut || new Date();
    const diff = endTime.getTime() - attendanceRecord.clockIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance Details</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Calendar size={24} color="#4A90E2" />
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDate(attendanceRecord.clockIn)}</Text>
            <Text style={styles.dayText}>
              {attendanceRecord.clockIn.toLocaleDateString('en-US', { weekday: 'long' })}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: attendanceRecord.status === 'completed' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusText}>
              {attendanceRecord.status === 'completed' ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        {/* Time Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Time Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <LogIn size={20} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Clock In</Text>
              <Text style={styles.summaryValue}>{formatTime(attendanceRecord.clockIn)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <LogOut size={20} color="#F44336" />
              <Text style={styles.summaryLabel}>Clock Out</Text>
              <Text style={styles.summaryValue}>
                {attendanceRecord.clockOut ? formatTime(attendanceRecord.clockOut) : 'In Progress'}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Clock size={20} color="#4A90E2" />
              <Text style={styles.summaryLabel}>Total Hours</Text>
              <Text style={styles.summaryValue}>{calculateWorkHours()}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Coffee size={20} color="#FF9800" />
              <Text style={styles.summaryLabel}>Break Time</Text>
              <Text style={styles.summaryValue}>
                {Math.floor((attendanceRecord.breakTime || 0) / 60)}h {(attendanceRecord.breakTime || 0) % 60}m
              </Text>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Location</Text>
          <Text style={styles.locationAddress}>{attendanceRecord.location.address}</Text>
          <Text style={styles.locationCoords}>
            {attendanceRecord.location.latitude.toFixed(6)}, {attendanceRecord.location.longitude.toFixed(6)}
          </Text>
        </View>

        {/* Selfie Photos Section */}
        <View style={styles.photosSection}>
          <Text style={styles.photosTitle}>Verification Photos</Text>
          
          {photos.length === 0 ? (
            <EmptyState
              icon={<Camera size={48} color="#E0E0E0" />}
              title="No photos available"
              message="No verification photos were taken for this attendance record"
            />
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoCard}
                  onPress={() => handlePhotoPress(photo)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.photoTypeIndicator,
                    { backgroundColor: getPhotoTypeColor(photo.type) }
                  ]}>
                    {getPhotoIcon(photo.type)}
                    <Text style={styles.photoTypeText}>{photo.label}</Text>
                  </View>
                  
                  <View style={styles.photoContainer}>
                    <Image 
                      source={{ uri: photo.url }} 
                      style={styles.photoThumbnail}
                      onError={() => {
                        console.error('Failed to load photo:', photo.url);
                        setPhotoError(`Failed to load ${photo.label.toLowerCase()}`);
                      }}
                    />
                    <View style={styles.photoOverlay}>
                      <Camera size={20} color="white" />
                    </View>
                  </View>
                  
                  <Text style={styles.photoTime}>
                    {formatTime(photo.timestamp)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Activities Timeline */}
        <View style={styles.activitiesSection}>
          <Text style={styles.activitiesTitle}>Activity Timeline</Text>
          
          {recordActivities.length === 0 ? (
            <View style={styles.noActivities}>
              <Text style={styles.noActivitiesText}>No additional activities recorded</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {recordActivities
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                .map((activity, index) => (
                <View key={activity.id || index} style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    {getPhotoIcon(activity.type)}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatTime(activity.timestamp)}
                    </Text>
                    {activity.notes && (
                      <Text style={styles.timelineNotes}>{activity.notes}</Text>
                    )}
                  </View>
                  {activity.selfieUrl && (
                    <TouchableOpacity
                      style={styles.timelinePhoto}
                      onPress={() => handlePhotoPress({
                        type: activity.type as any,
                        url: activity.selfieUrl!,
                        timestamp: activity.timestamp,
                        label: `${activity.type.replace('_', ' ')} Photo`,
                      })}
                    >
                      <Image source={{ uri: activity.selfieUrl }} style={styles.timelinePhotoImage} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes Section */}
        {attendanceRecord.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{attendanceRecord.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Full Screen Photo Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPhotoModal}
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalContent}>
            {selectedPhoto && (
              <>
                <View style={styles.photoModalHeader}>
                  <View style={styles.photoModalInfo}>
                    <Text style={styles.photoModalTitle}>{selectedPhoto.label}</Text>
                    <Text style={styles.photoModalTime}>
                      {selectedPhoto.timestamp.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setShowPhotoModal(false)}
                    style={styles.photoModalClose}
                  >
                    <X size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.photoModalImageContainer}>
                  <Image 
                    source={{ uri: selectedPhoto.url }} 
                    style={styles.photoModalImage}
                    resizeMode="contain"
                    onError={() => {
                      Alert.alert('Error', 'Failed to load full-size image');
                      setShowPhotoModal(false);
                    }}
                  />
                </View>

                <View style={styles.photoModalFooter}>
                  <View style={[
                    styles.photoModalTypeBadge,
                    { backgroundColor: getPhotoTypeColor(selectedPhoto.type) }
                  ]}>
                    {getPhotoIcon(selectedPhoto.type)}
                    <Text style={styles.photoModalTypeBadgeText}>
                      {selectedPhoto.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Error Display */}
      {photoError && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#F44336" />
          <Text style={styles.errorText}>{photoError}</Text>
          <TouchableOpacity onPress={() => setPhotoError(null)}>
            <X size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
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
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
  },
  photosSection: {
    marginBottom: 24,
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  photoTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  photoThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  photoTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activitiesSection: {
    marginBottom: 24,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  noActivities: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#666',
  },
  timeline: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  timelinePhoto: {
    marginLeft: 8,
  },
  timelinePhotoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: insets.top + 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  photoModalInfo: {
    flex: 1,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  photoModalTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  photoModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoModalImage: {
    width: '100%',
    height: '100%',
    maxWidth: width - 40,
    maxHeight: height * 0.7,
  },
  photoModalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  photoModalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoModalTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  errorBanner: {
    position: 'absolute',
    top: insets.top + 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    marginRight: 8,
  },
});