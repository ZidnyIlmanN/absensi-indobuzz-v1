import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
} from 'lucide-react-native';

interface ShiftSchedule {
  id: string;
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'office' | 'remote' | 'hybrid';
  status: 'scheduled' | 'completed' | 'missed';
}

export default function ShiftScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const schedules: ShiftSchedule[] = [
    {
      id: '1',
      date: '2024-02-12',
      dayName: 'Monday',
      startTime: '09:00',
      endTime: '18:00',
      location: 'Jakarta Office',
      type: 'office',
      status: 'scheduled',
    },
    {
      id: '2',
      date: '2024-02-13',
      dayName: 'Tuesday',
      startTime: '09:00',
      endTime: '18:00',
      location: 'Remote Work',
      type: 'remote',
      status: 'scheduled',
    },
    {
      id: '3',
      date: '2024-02-14',
      dayName: 'Wednesday',
      startTime: '09:00',
      endTime: '18:00',
      location: 'Jakarta Office',
      type: 'office',
      status: 'scheduled',
    },
    {
      id: '4',
      date: '2024-02-15',
      dayName: 'Thursday',
      startTime: '09:00',
      endTime: '18:00',
      location: 'Hybrid',
      type: 'hybrid',
      status: 'scheduled',
    },
    {
      id: '5',
      date: '2024-02-16',
      dayName: 'Friday',
      startTime: '09:00',
      endTime: '17:00',
      location: 'Jakarta Office',
      type: 'office',
      status: 'scheduled',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'office':
        return '#4A90E2';
      case 'remote':
        return '#4CAF50';
      case 'hybrid':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getTypeBackground = (type: string) => {
    switch (type) {
      case 'office':
        return '#E3F2FD';
      case 'remote':
        return '#E8F5E8';
      case 'hybrid':
        return '#FFF3E0';
      default:
        return '#F8F9FA';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'missed':
        return '#F44336';
      case 'scheduled':
        return '#FF9800';
      default:
        return '#666';
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
          <Text style={styles.headerTitle}>Jadwal Shift</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          
          {schedules.map((schedule) => (
            <TouchableOpacity
              key={schedule.id}
              style={styles.scheduleCard}
              activeOpacity={0.7}
            >
              <View style={styles.scheduleHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color="#4A90E2" />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dayName}>{schedule.dayName}</Text>
                    <Text style={styles.dateText}>
                      {new Date(schedule.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(schedule.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.scheduleDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {schedule.startTime} - {schedule.endTime}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.detailText}>{schedule.location}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <View style={[
                    styles.typeIndicator,
                    { backgroundColor: getTypeBackground(schedule.type) }
                  ]}>
                    <Text style={[
                      styles.typeText,
                      { color: getTypeColor(schedule.type) }
                    ]}>
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Schedule Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Summary</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Calendar size={20} color="#4A90E2" />
              </View>
              <Text style={styles.summaryValue}>5</Text>
              <Text style={styles.summaryLabel}>Total Days</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Clock size={20} color="#4CAF50" />
              </View>
              <Text style={styles.summaryValue}>44h</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Users size={20} color="#FF9800" />
              </View>
              <Text style={styles.summaryValue}>3</Text>
              <Text style={styles.summaryLabel}>Office Days</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfo: {
    marginLeft: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  scheduleDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
});