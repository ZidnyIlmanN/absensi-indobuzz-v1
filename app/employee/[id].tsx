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
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  Award,
  Star,
  MessageCircle,
  Share,
  MoreVertical,
  Building,
  CreditCard,
  Activity,
  TrendingUp,
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { employeesService } from '@/services/employees';
import { Employee } from '@/types';
import { EmployeeContactCard } from '@/components/EmployeeContactCard';
import { useI18n } from '@/hooks/useI18n';

export default function EmployeeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (id) {
      loadEmployeeDetails();
    }
  }, [id]);

  const loadEmployeeDetails = async () => {
    if (!id || typeof id !== 'string') {
      setError(t('employee.no_employee_id'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { employee: employeeData, error: fetchError } = await employeesService.getEmployeeById(id);
      
      if (fetchError) {
        setError(fetchError);
      } else if (employeeData) {
        setEmployee(employeeData);
      } else {
        setError(t('employee.no_employees_found'));
      }
    } catch (error) {
      console.error('Error loading employee details:', error);
      setError(t('employee.failed_to_load'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployeeDetails();
    setRefreshing(false);
  };

  const handleCall = () => {
    if (employee?.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    } else {
      Alert.alert(t('employee.no_phone'), t('employee.no_phone_on_file'));
    }
  };

  const handleEmail = () => {
    if (employee?.email) {
      Linking.openURL(`mailto:${employee.email}`);
    } else {
      Alert.alert(t('employee.no_email'), t('employee.no_email_on_file'));
    }
  };

  const handleMessage = () => {
    Alert.alert(t('common.message'), t('common.coming_soon'));
  };

  const handleShare = () => {
    Alert.alert(t('common.share'), t('common.coming_soon'));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'break':
        return '#FF9800';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return t('employee.online');
      case 'break':
        return t('employee.on_break');
      case 'offline':
        return t('employee.offline');
      default:
        return t('common.na');
    }
  };

  const calculateTenure = () => {
    if (!employee?.joinDate) return 'N/A';
    
    const joinDate = new Date(employee.joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} ${t('time_off.days')}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${t('time_off.months')}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} ${t('time_off.years')}${remainingMonths > 0 ? `, ${remainingMonths} ${t('time_off.months')}` : ''}`;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text={t('common.loading')} />
      </View>
    );
  }

  if (error || !employee) {
    return (
      <View style={styles.errorContainer}>
        <User size={64} color="#E0E0E0" />
        <Text style={styles.errorTitle}>{t('employee.no_employees_found')}</Text>
        <Text style={styles.errorText}>
          {error || t('employee.no_employee_data')}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
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
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('employee.employee_details')}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={20} color="white" />
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
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=120`
              }} 
              style={styles.avatar} 
            />
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(employee.status) }
              ]}
            />
          </View>
          
          <Text style={styles.employeeName}>{employee.name}</Text>
          <Text style={styles.employeePosition}>{employee.position}</Text>
          <Text style={styles.employeeDepartment}>{employee.department}</Text>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(employee.status)}</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
              <Phone size={20} color="#4CAF50" />
              <Text style={styles.quickActionText}>{t('common.call')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleEmail}>
              <Mail size={20} color="#2196F3" />
              <Text style={styles.quickActionText}>{t('common.email')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleMessage}>
              <MessageCircle size={20} color="#FF9800" />
              <Text style={styles.quickActionText}>{t('common.message')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleShare}>
              <Share size={20} color="#9C27B0" />
              <Text style={styles.quickActionText}>{t('common.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personal_information')}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <CreditCard size={18} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('employee.employee_id')}</Text>
                <Text style={styles.infoValue}>{employee.employeeId}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail size={18} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('common.email')}</Text>
                <Text style={styles.infoValue}>{employee.email}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone size={18} color="#4CAF50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('common.phone')}</Text>
                <Text style={styles.infoValue}>{employee.phone || t('common.na')}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin size={18} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('common.location')}</Text>
                <Text style={styles.infoValue}>{employee.location || t('common.na')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Work Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.work_information')}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Briefcase size={18} color="#9C27B0" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('employee.position')}</Text>
                <Text style={styles.infoValue}>{employee.position}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Building size={18} color="#607D8B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('employee.department')}</Text>
                <Text style={styles.infoValue}>{employee.department}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color="#FF5722" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.join_date')}</Text>
                <Text style={styles.infoValue}>
                  {employee.joinDate 
                    ? new Date(employee.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : t('common.na')
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <TrendingUp size={18} color="#4CAF50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('employee.tenure')}</Text>
                <Text style={styles.infoValue}>{calculateTenure()}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Clock size={18} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.work_schedule')}</Text>
                <Text style={styles.infoValue}>{employee.workHours}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.status')}</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Activity size={20} color={getStatusColor(employee.status)} />
              <Text style={[styles.statusTitle, { color: getStatusColor(employee.status) }]}>
                {getStatusText(employee.status)}
              </Text>
            </View>
            
            {employee.currentAttendance && (
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceLabel}>{t('home.todays_overview')}</Text>
                <Text style={styles.attendanceValue}>
                  {t('attendance.clock_in')}: {employee.currentAttendance.clockIn.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                {employee.currentAttendance.clockOut && (
                  <Text style={styles.attendanceValue}>
                    {t('attendance.clock_out')}: {employee.currentAttendance.clockOut.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                )}
                <Text style={styles.attendanceValue}>
                  {t('home.work_hours')}: {Math.floor(employee.currentAttendance.workHours)}h {Math.floor((employee.currentAttendance.workHours % 1) * 60)}m
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.section}>
          <EmployeeContactCard 
            employee={employee}
            showActions={true}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  headerBackButton: {
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
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  employeeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  employeePosition: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  employeeDepartment: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 24,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  attendanceInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  attendanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  attendanceValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  skillsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  skillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  skillText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
});