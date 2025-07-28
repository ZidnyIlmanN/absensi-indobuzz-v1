import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  LogIn,
  LogOut,
  Camera,
} from 'lucide-react-native';
import { AttendanceCard } from '@/components/AttendanceCard';
import { QuickActionCard } from '@/components/QuickActionCard';
import { StatsCard } from '@/components/StatsCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [isWorking, setIsWorking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workHours, setWorkHours] = useState('00:00');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (clockInTime) {
        const diff = new Date().getTime() - clockInTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setWorkHours(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [clockInTime]);

  const handleClockIn = () => {
    Alert.alert(
      'Clock In',
      'Are you sure you want to clock in?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setIsWorking(true);
            setClockInTime(new Date());
            Alert.alert('Success', 'You have successfully clocked in!');
          },
        },
      ]
    );
  };

  const handleClockOut = () => {
    Alert.alert(
      'Clock Out',
      'Please take a selfie to confirm clock out',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Selfie',
          onPress: () => {
            setIsWorking(false);
            setClockInTime(null);
            setWorkHours('00:00');
            Alert.alert('Success', 'You have successfully clocked out!');
          },
        },
      ]
    );
  };

  const quickActions = [
    {
      title: 'Live\nAttendance',
      icon: <TrendingUp size={24} color="#4A90E2" />,
      color: '#E3F2FD',
    },
    {
      title: 'Time Off',
      icon: <Calendar size={24} color="#FF6B6B" />,
      color: '#FFEBEE',
    },
    {
      title: 'Reimburse',
      icon: <Clock size={24} color="#4CAF50" />,
      color: '#E8F5E8',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.userName}>Employee Name</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <Text style={styles.currentDate}>
              {currentTime.toLocaleDateString([], {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Attendance Card */}
        <AttendanceCard
          isWorking={isWorking}
          workHours={workHours}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          clockInTime={clockInTime}
        />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                icon={action.icon}
                backgroundColor={action.color}
                onPress={() => Alert.alert('Feature', `${action.title} feature coming soon!`)}
              />
            ))}
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Work Hours"
              value={workHours}
              icon={<Clock size={20} color="#4A90E2" />}
              color="#E3F2FD"
            />
            <StatsCard
              title="Status"
              value={isWorking ? "Working" : "Off"}
              icon={<TrendingUp size={20} color="#4CAF50" />}
              color="#E8F5E8"
            />
          </View>
        </View>

        {/* Recent Attendance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.attendanceList}>
            <View style={styles.attendanceItem}>
              <View style={styles.attendanceIconContainer}>
                <LogIn size={20} color="#4CAF50" />
              </View>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceType}>Clock In</Text>
                <Text style={styles.attendanceTime}>08:30 AM</Text>
                <Text style={styles.attendanceDate}>Today</Text>
              </View>
              <View style={styles.attendanceStatus}>
                <Text style={[styles.statusText, { color: '#4CAF50' }]}>Success</Text>
              </View>
            </View>

            <View style={styles.attendanceItem}>
              <View style={styles.attendanceIconContainer}>
                <LogOut size={20} color="#FF6B6B" />
              </View>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceType}>Clock Out</Text>
                <Text style={styles.attendanceTime}>17:30 PM</Text>
                <Text style={styles.attendanceDate}>Yesterday</Text>
              </View>
              <View style={styles.attendanceStatus}>
                <Text style={[styles.statusText, { color: '#FF9800' }]}>Pending</Text>
              </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  currentDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  attendanceList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  attendanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  attendanceTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attendanceDate: {
    fontSize: 12,
    color: '#999',
  },
  attendanceStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});