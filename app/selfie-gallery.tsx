import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Calendar, Clock, X, Download, Trash2, RefreshCw } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { imageService } from '@/services/imageService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { subscribeToTable } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 images per row with padding

interface SelfieItem {
  url: string;
  fileName: string;
  timestamp: Date;
  type: string;
  id?: string;
}

export default function SelfieGalleryScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentAttendance, todayActivities } = useAppContext();
  const [selfies, setSelfies] = useState<SelfieItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSelfie, setSelectedSelfie] = useState<SelfieItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    loadSelfies();
    
    // Set up real-time subscription for new selfies
    let unsubscribe: (() => void) | null = null;
    
    if (realTimeEnabled && user) {
      unsubscribe = subscribeToTable(
        'activity_records',
        (payload) => {
          console.log('Real-time activity update:', payload);
          if (payload.eventType === 'INSERT' && payload.new.user_id === user.id && payload.new.selfie_url) {
            // New activity with selfie added, refresh gallery
            loadSelfies();
          }
        },
        `user_id=eq.${user.id}`
      );
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Watch for changes in current attendance and activities to update gallery
  useEffect(() => {
    if (currentAttendance || todayActivities.length > 0) {
      // Debounce the reload to avoid too frequent updates
      const timeoutId = setTimeout(() => {
        loadSelfies();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentAttendance?.selfieUrl, todayActivities.length]);
  const loadSelfies = async () => {
    if (!user) return;

    if (!refreshing) {
      setIsLoading(true);
    }
    
    try {
      const { urls, error } = await imageService.getUserSelfies(user.id);
      
      if (error) {
        console.error('Failed to load selfies:', error);
        Alert.alert('Error', 'Failed to load selfies: ' + error);
        return;
      }

      // Parse selfie information from URLs
      const selfieItems: SelfieItem[] = urls.map(url => {
        const fileName = url.split('/').pop() || '';
        const parts = fileName.split('_');
        const type = parts[0] || 'general';
        const timestampStr = parts.slice(1).join('_').replace('.jpg', '');
        const timestamp = new Date(timestampStr.replace(/-/g, ':'));
        
        return {
          url,
          fileName,
          timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
          type,
          id: fileName, // Use filename as unique ID
        };
      });

      // Sort by timestamp (newest first)
      selfieItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setSelfies(selfieItems);
      console.log(`Loaded ${selfieItems.length} selfies`);
    } catch (error) {
      console.error('Error loading selfies:', error);
      Alert.alert('Error', 'Failed to load selfies');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSelfies();
    setRefreshing(false);
  };

  const handleSelfiePress = (selfie: SelfieItem) => {
    setSelectedSelfie(selfie);
    setShowModal(true);
  };

  const handleToggleRealTime = () => {
    setRealTimeEnabled(!realTimeEnabled);
    if (!realTimeEnabled) {
      // Re-enable and reload
      loadSelfies();
    }
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'clock_in':
        return '#4CAF50';
      case 'clock_out':
        return '#F44336';
      case 'break_start':
      case 'break_end':
        return '#FF9800';
      default:
        return '#4A90E2';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'clock_in':
        return 'Clock In';
      case 'clock_out':
        return 'Clock Out';
      case 'break_start':
        return 'Break Start';
      case 'break_end':
        return 'Break End';
      default:
        return 'General';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Text style={styles.headerTitle}>Selfie Gallery</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleToggleRealTime}
          >
            <RefreshCw 
              size={20} 
              color={realTimeEnabled ? "#4CAF50" : "rgba(255,255,255,0.6)"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Real-time indicator */}
        <View style={styles.realTimeIndicator}>
          <View style={[
            styles.realTimeDot,
            { backgroundColor: realTimeEnabled ? '#4CAF50' : '#999' }
          ]} />
          <Text style={styles.realTimeText}>
            {realTimeEnabled ? 'Live Updates On' : 'Live Updates Off'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Camera size={20} color="#4A90E2" />
            <Text style={styles.statValue}>{selfies.length}</Text>
            <Text style={styles.statLabel}>Total Selfies</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={20} color="#4CAF50" />
            <Text style={styles.statValue}>
              {selfies.filter(s => s.type === 'clock_in').length}
            </Text>
            <Text style={styles.statLabel}>Clock In</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={20} color="#F44336" />
            <Text style={styles.statValue}>
              {selfies.filter(s => s.type === 'clock_out').length}
            </Text>
            <Text style={styles.statLabel}>Clock Out</Text>
          </View>
        </View>

        {/* Selfies Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Selfies</Text>
          
          {/* Loading indicator for real-time updates */}
          {isLoading && selfies.length > 0 && (
            <View style={styles.updateIndicator}>
              <LoadingSpinner size="small" color="#4A90E2" />
              <Text style={styles.updateText}>Checking for new photos...</Text>
            </View>
          )}
          
          {isLoading ? (
            <LoadingSpinner text="Loading selfies..." />
          ) : selfies.length === 0 ? (
            <EmptyState
              icon={<Camera size={48} color="#E0E0E0" />}
              title="No selfies yet"
              message="Your attendance selfies will appear here"
              actionText="Refresh"
              onAction={loadSelfies}
            />
          ) : (
            <View style={styles.selfiesGrid}>
              {selfies.map((selfie, index) => (
                <TouchableOpacity
                  key={selfie.id || index}
                  style={styles.selfieItem}
                  onPress={() => handleSelfiePress(selfie)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ uri: selfie.url }} 
                    style={styles.selfieImage}
                    onError={() => {
                      console.error('Failed to load selfie:', selfie.url);
                    }}
                  />
                  
                  <View style={styles.selfieOverlay}>
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeColor(selfie.type) }
                    ]}>
                      <Text style={styles.typeBadgeText}>
                        {getTypeLabel(selfie.type)}
                      </Text>
                    </View>
                    
                    <Text style={styles.selfieDate}>
                      {formatDate(selfie.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Selfie Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSelfie && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {getTypeLabel(selectedSelfie.type)} Selfie
                  </Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <X size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <Image 
                  source={{ uri: selectedSelfie.url }} 
                  style={styles.modalImage}
                  resizeMode="contain"
                />

                <View style={styles.modalInfo}>
                  <Text style={styles.modalDate}>
                    {selectedSelfie.timestamp.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  
                  <View style={[
                    styles.modalTypeBadge,
                    { backgroundColor: getTypeColor(selectedSelfie.type) }
                  ]}>
                    <Text style={styles.modalTypeBadgeText}>
                      {getTypeLabel(selectedSelfie.type)}
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  realTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  realTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  realTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  realTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  selfiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selfieItem: {
    width: imageSize,
    height: imageSize,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
  },
  selfieDate: {
    fontSize: 10,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'black',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalImage: {
    flex: 1,
    width: '100%',
  },
  modalInfo: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});