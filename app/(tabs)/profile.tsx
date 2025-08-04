import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, CreditCard as Edit, Camera, MapPin, Phone, Mail, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProfilePhotoManager } from '@/components/ProfilePhotoManager';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, refreshData, isLoading, attendanceHistory, currentAttendance } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Helper to calculate work hours from clock in/out timestamps
  const calculateWorkHours = (clockIn: Date | undefined, clockOut: Date | undefined) => {
    if (!clockIn || !clockOut) return 0;
    const diffMs = clockOut.getTime() - clockIn.getTime();
    return diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
  };

  // Calculate total hours and total days from attendance history
  const calculateWorkStats = () => {
    // Combine current attendance with historical records
    const allRecords = currentAttendance 
      ? [...attendanceHistory, currentAttendance] 
      : attendanceHistory;

    // Calculate total work hours
    const totalHours = allRecords.reduce((sum, record) => {
      // For records with clock in/out times, calculate work hours
      if (record.clockIn && record.clockOut) {
        return sum + calculateWorkHours(record.clockIn, record.clockOut);
      }
      // For records without clock in/out, use stored workHours if available
      return sum + (record.workHours || 0);
    }, 0);

    // Total days is simply the count of records
    const totalDays = allRecords.length;

    return {
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
      totalDays: totalDays
    };
  };

  const { totalHours, totalDays } = calculateWorkStats();

  // Update stats when attendance data changes
  useEffect(() => {
    // This will trigger a re-render with updated stats
  }, [attendanceHistory, currentAttendance]);

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handlePhotoUpdated = (newAvatarUrl: string) => {
    // Photo updated successfully, refresh data if needed
    refreshData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Logout Error', error);
            } else {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: <Settings size={20} color="#4A90E2" />,
      title: 'Settings',
      subtitle: 'App preferences and configurations',
      onPress: () => {
        console.log('Navigating to /settings');
        router.navigate('/settings');
      },
    },
    {
      icon: <Bell size={20} color="#FF9800" />,
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => {
        console.log('Navigating to /notifications');
        router.navigate('/notifications');
      },
    },
    {
      icon: <Shield size={20} color="#4CAF50" />,
      title: 'Privacy & Security',
      subtitle: 'Control your privacy settings',
      onPress: () => {
        console.log('Navigating to /privacy');
        router.navigate('/privacy');
      },
    },
    {
      icon: <HelpCircle size={20} color="#9C27B0" />,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => {
        console.log('Navigating to /help');
        router.navigate('/help');
      },
    },
  ];

  if (isLoading || !user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleEditProfile}>
            <Edit size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <ProfilePhotoManager
            currentAvatarUrl={user.avatar}
            size={100}
            showEditButton={true}
            onPhotoUpdated={handlePhotoUpdated}
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profilePosition}>{user.position}</Text>
            <Text style={styles.profileDepartment}>{user.department}</Text>
            <Text style={styles.employeeId}>ID: {user.employeeId}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail size={18} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone size={18} color="#4CAF50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin size={18} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{user.location || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color="#9C27B0" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Join Date</Text>
                <Text style={styles.infoValue}>
                  {user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Work Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Information</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Clock size={20} color="#4A90E2" />
              </View>
              <Text style={styles.statValue}>{totalHours} hours</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Calendar size={20} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{totalDays} days</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Clock size={18} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Work Schedule</Text>
                <Text style={styles.infoValue}>{user.workSchedule || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings & Support</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                {item.icon}
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={16} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#F44336" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: -10,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
});
