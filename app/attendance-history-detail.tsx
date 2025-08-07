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
import { ArrowLeft, Clock, Calendar, LogIn, LogOut, Coffee, Camera, X, ZoomIn, Download } from 'lucide-react-native';
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
  const [isLoading, setIsLoading] = useState(false);

  // Find the attendance record
  const attendanceRecord = attendanceHistory.find(record => record.id === attendanceId) || 
    (currentAttendance?.id === attendanceId ? currentAttendance : null);

  if (!attendanceRecord) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
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
            <Text style={styles.headerTitle}>Attendance Detail</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <EmptyState
          icon={<Calendar size={48} color="#E0E0E0" />}
          title="Record Not Found"
          message="The attendance record could not be found"
        />
      </View>
    );
  }

  // Get activities for this attendance record
  const activities = attendanceRecord.activities || 
    (attendanceRecord.id === currentAttendance?.id ? todayActivities : []);

  // Build photos array from activities and attendance record
  const buildPhotosArray = (): AttendancePhoto[] => {
    const photos: AttendancePhoto[] = [];

    // Clock in photo
    if (attendanceRecord.selfieUrl) {
      photos.push({
        type: 'clock_in',
        url: attendanceRecord.selfieUrl,
        timestamp: attendanceRecord.clockIn,
        label: 'Clock In Photo',
      });
    }

    // Activity photos
    activities.forEach(activity => {
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
        return '#4CAF50';
      case 'clock_out':
        return '#F44336';
      case 'break_start':
      case 'break_end':
        return '#FF9800';
      default:
        return '#666';
    }
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

  const calculateWorkHours = () => {
    if (!attendanceRecord.clockOut) {
      // If still working, calculate from clock in to now
      const now = new Date();
      const diff = now.getTime() - attendanceRecord.clockIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // Calculate total work hours
      const diff = attendanceRecord.clockOut.getTime() - attendanceRecord.clockIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
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
          <Text style={styles.headerTitle}>Attendance Detail</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Calendar size={24} color="#4A90E2" />
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDate(attendanceRecord.clockIn)}</Text>
            <Text style={styles.statusText}>
              Status: {attendanceRecord.status === 'working' ? 'Working' : 'Completed'}
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
                {attendanceRecord.clockOut ? formatTime(attendanceRecord.clockOut) : 'Working...'}
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
                {Math.floor(attendanceRecord.breakTime / 60)}h {attendanceRecord.breakTime % 60}m
              </Text>
            </View>
          </View>
        </View>

        {/* Activities Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          
          <View style={styles.timeline}>
            {/* Clock In */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: '#4CAF50' }]}>
                <LogIn size={16} color="white" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Clocked In</Text>
                <Text style={styles.timelineTime}>{formatTime(attendanceRecord.clockIn)}</Text>
                <Text style={styles.timelineLocation}>{attendanceRecord.location.address}</Text>
              </View>
            </View>

            {/* Activities */}
            {activities.map((activity, index) => (
              <View key={activity.id || index} style={styles.timelineItem}>
                <View style={[
                  styles.timelineIcon,
                  { backgroundColor: getPhotoTypeColor(activity.type) }
                ]}>
                  {getPhotoIcon(activity.type)}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    {activity.type === 'break_start' ? 'Break Started' :
                     activity.type === 'break_end' ? 'Break Ended' :
                     activity.type === 'clock_out' ? 'Clocked Out' :
                     activity.type}
                  </Text>
                  <Text style={styles.timelineTime}>{formatTime(activity.timestamp)}</Text>
                  {activity.location && (
                    <Text style={styles.timelineLocation}>{activity.location.address}</Text>
                  )}
                  {activity.notes && (
                    <Text style={styles.timelineNotes}>{activity.notes}</Text>
                  )}
                </View>
              </View>
            ))}

            {/* Clock Out (if completed) */}
            {attendanceRecord.clockOut && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: '#F44336' }]}>
                  <LogOut size={16} color="white" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Clocked Out</Text>
                  <Text style={styles.timelineTime}>{formatTime(attendanceRecord.clockOut)}</Text>
                  <Text style={styles.timelineLocation}>{attendanceRecord.location.address}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Photos</Text>
          
          {photos.length === 0 ? (
            <EmptyState
              icon={<Camera size={48} color="#E0E0E0" />}
              title="No Photos Available"
              message="No verification photos found for this attendance record"
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
                  <View style={styles.photoContainer}>
                    <Image 
                      source={{ uri: photo.url }} 
                      style={styles.photoImage}
                      onError={() => {
                        console.error('Failed to load photo:', photo.url);
                      }}
                    />
                    <View style={styles.photoOverlay}>
                      <View style={[
                        styles.photoTypeBadge,
                        { backgroundColor: getPhotoTypeColor(photo.type) }
                      ]}>
                        {getPhotoIcon(photo.type)}
                      </View>
                      <TouchableOpacity style={styles.zoomButton}>
                        <ZoomIn size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoLabel}>{photo.label}</Text>
                    <Text style={styles.photoTime}>{formatTime(photo.timestamp)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          
          <View style={styles.locationCard}>
            <Text style={styles.locationAddress}>{attendanceRecord.location.address}</Text>
            <Text style={styles.locationCoordinates}>
              {attendanceRecord.location.latitude.toFixed(6)}, {attendanceRecord.location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {attendanceRecord.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{attendanceRecord.notes}</Text>
            </View>
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
                      {formatDate(selectedPhoto.timestamp)} at {formatTime(selectedPhoto.timestamp)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoModalClose}
                    onPress={() => setShowPhotoModal(false)}
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
                      Alert.alert('Error', 'Failed to load photo');
                      setShowPhotoModal(false);
                    }}
                  />
                </View>

                <View style={styles.photoModalActions}>
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    marginBottom: 8,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  timeline: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  timelineLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  photoTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInfo: {
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  photoTime: {
    fontSize: 12,
    color: '#666',
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  photoModalActions: {
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
    color: 'white',
    marginLeft: 6,
  },
});