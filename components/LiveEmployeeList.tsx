import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { MapPin, Clock, Users, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface LiveEmployeeListProps {
  onEmployeeFocus?: (employee: Employee) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function LiveEmployeeList({
  onEmployeeFocus,
  refreshing = false,
  onRefresh,
}: LiveEmployeeListProps) {
  const { t } = useTranslation();
  const { employees, isLoading, error, refreshEmployees } = useEmployees();
  
  // Filter employees who have attendance records for today (working or on break)
  const activeEmployees = employees.filter(emp => 
    emp.status === 'online' || emp.status === 'break' || emp.currentAttendance
  );
  
  console.log('LiveEmployeeList - Total employees:', employees.length);
  console.log('LiveEmployeeList - Active employees:', activeEmployees.length);
  console.log('LiveEmployeeList - Employee statuses:', employees.map(e => ({ name: e.name, status: e.status, hasAttendance: !!e.currentAttendance })));

  const handleEmployeePress = (employee: Employee) => {
    onEmployeeFocus?.(employee);
  };

  const handleRefresh = async () => {
    await refreshEmployees();
    onRefresh?.();
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
        return t('employee.working');
      case 'break':
        return t('employee.on_break');
      case 'offline':
        return t('employee.offline');
      default:
        return t('common.na');
    }
  };

  const formatWorkTime = (employee: Employee) => {
    if (!employee.currentAttendance?.clockIn) return '--:--';
    
    const now = new Date();
    const clockIn = employee.currentAttendance.clockIn;
    const diff = now.getTime() - clockIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };

  if (isLoading && workingEmployees.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text={t('live_tracking.loading_employees')} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Users size={48} color="#E0E0E0" />}
          title={t('common.error')}
          message={error}
          actionText={t('common.retry')}
          onAction={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={20} color="#4A90E2" />
          <Text style={styles.headerTitle}>
            {t('live_tracking.live_attendance')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{activeEmployees.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeEmployees.length === 0 ? (
          <EmptyState
            icon={<Users size={48} color="#E0E0E0" />}
            title={t('live_tracking.no_employees_working')}
            message={t('live_tracking.no_active_employees')}
          />
        ) : (
          activeEmployees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.employeeCard}
              onPress={() => handleEmployeePress(employee)}
              activeOpacity={0.7}
            >
              <View style={styles.employeeHeader}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{
                      uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=40`
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
                
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  <Text style={styles.employeePosition}>{employee.position}</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#666" />
                    <Text style={styles.locationText}>{employee.location}</Text>
                  </View>
                </View>
                
                <View style={styles.timeInfo}>
                  <Text style={styles.workTime}>{formatWorkTime(employee)}</Text>
                  <Text style={styles.statusText}>
                    {getStatusText(employee.status)}
                  </Text>
                  <TouchableOpacity style={styles.focusButton}>
                    <Navigation size={14} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  employeeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 12,
    color: '#4A90E2',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  workTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  focusButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 4,
  },
});