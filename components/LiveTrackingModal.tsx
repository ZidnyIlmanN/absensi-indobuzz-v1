import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Users,
  Building,
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Employee } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  employeeCount?: number;
}

interface LiveTrackingModalProps {
  employees: Employee[];
  officeLocations: OfficeLocation[];
  selectedEmployeeId: string | null;
  selectedOfficeId: string | null;
  onEmployeeSelect: (employeeId: string) => void;
  onOfficeSelect: (officeId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  error: string | null;
}

export function LiveTrackingModal({
  employees,
  officeLocations,
  selectedEmployeeId,
  selectedOfficeId,
  onEmployeeSelect,
  onOfficeSelect,
  onRefresh,
  isLoading,
  error,
}: LiveTrackingModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'employees' | 'offices'>('employees');

  const onlineEmployees = employees.filter(emp => emp.status === 'online' && emp.currentLocation);
  const breakEmployees = employees.filter(emp => emp.status === 'break' && emp.currentLocation);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'break':
        return '#FF9800';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#4A90E2';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return t('live_tracking.working');
      case 'break':
        return t('live_tracking.on_break');
      case 'offline':
        return t('live_tracking.offline');
      default:
        return t('live_tracking.unknown');
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m ${t('live_tracking.away')}`;
    } else {
      return `${(distance / 1000).toFixed(1)}km ${t('live_tracking.away')}`;
    }
  };

  const renderEmployeeItem = (employee: Employee) => (
    <TouchableOpacity
      key={employee.id}
      style={[
        styles.listItem,
        selectedEmployeeId === employee.id && styles.selectedItem
      ]}
      onPress={() => onEmployeeSelect(employee.id)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=40`
            }}
            style={styles.avatar}
          />
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(employee.status) }
          ]} />
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{employee.name}</Text>
          <Text style={styles.itemSubtitle}>{employee.position}</Text>
          <Text style={styles.itemDepartment}>{employee.department}</Text>
          
          <View style={styles.itemMeta}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(employee.status) }
              ]} />
              <Text style={styles.statusText}>{getStatusText(employee.status)}</Text>
            </View>
            
            {employee.currentLocation && (
              <View style={styles.locationContainer}>
                <MapPin size={12} color="#666" />
                <Text style={styles.locationText}>
                  {t('live_tracking.location_available')}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.itemActions}>
          <ChevronRight size={16} color="#C7C7CC" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOfficeItem = (office: OfficeLocation) => (
    <TouchableOpacity
      key={office.id}
      style={[
        styles.listItem,
        selectedOfficeId === office.id && styles.selectedItem
      ]}
      onPress={() => onOfficeSelect(office.id)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.officeIconContainer}>
          <Building size={24} color="#F44336" />
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{office.name}</Text>
          <Text style={styles.itemSubtitle}>{office.address}</Text>
          
          <View style={styles.itemMeta}>
            {office.distance && (
              <View style={styles.distanceContainer}>
                <Navigation size={12} color="#666" />
                <Text style={styles.distanceText}>
                  {formatDistance(office.distance)}
                </Text>
              </View>
            )}
            
            {office.employeeCount !== undefined && (
              <View style={styles.employeeCountContainer}>
                <Users size={12} color="#4A90E2" />
                <Text style={styles.employeeCountText}>
                  {office.employeeCount} {t('live_tracking.employees')}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.itemActions}>
          <ChevronRight size={16} color="#C7C7CC" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.modalContainer}>
      {/* Modal Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{t('live_tracking.live_attendance')}</Text>
        <Text style={styles.modalSubtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employees' && styles.activeTab]}
          onPress={() => setActiveTab('employees')}
        >
          <Users size={16} color={activeTab === 'employees' ? '#4A90E2' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'employees' && styles.activeTabText]}>
            {t('live_tracking.employees')} ({onlineEmployees.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offices' && styles.activeTab]}
          onPress={() => setActiveTab('offices')}
        >
          <Building size={16} color={activeTab === 'offices' ? '#4A90E2' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'offices' && styles.activeTabText]}>
            {t('live_tracking.offices')} ({officeLocations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <WifiOff size={48} color="#E0E0E0" />
            <Text style={styles.errorTitle}>{t('common.error')}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'employees' ? (
          <View style={styles.tabContent}>
            {/* Online Employees */}
            {onlineEmployees.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Activity size={16} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>
                    {t('live_tracking.working_now')} ({onlineEmployees.length})
                  </Text>
                </View>
                
                {onlineEmployees.map(renderEmployeeItem)}
              </View>
            )}

            {/* Break Employees */}
            {breakEmployees.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Clock size={16} color="#FF9800" />
                  <Text style={styles.sectionTitle}>
                    {t('live_tracking.on_break')} ({breakEmployees.length})
                  </Text>
                </View>
                
                {breakEmployees.map(renderEmployeeItem)}
              </View>
            )}

            {/* Empty State */}
            {onlineEmployees.length === 0 && breakEmployees.length === 0 && (
              <EmptyState
                icon={<Users size={48} color="#E0E0E0" />}
                title={t('live_tracking.no_employees_online')}
                message={t('live_tracking.no_employees_message')}
              />
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Office Locations */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Building size={16} color="#F44336" />
                <Text style={styles.sectionTitle}>
                  {t('live_tracking.office_locations')}
                </Text>
              </View>
              
              {officeLocations.length > 0 ? (
                officeLocations.map(renderOfficeItem)
              ) : (
                <EmptyState
                  icon={<Building size={48} color="#E0E0E0" />}
                  title={t('live_tracking.no_offices_found')}
                  message={t('live_tracking.no_offices_message')}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Status Indicator */}
      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <Wifi size={16} color="#4CAF50" />
          <Text style={styles.statusText}>
            {t('live_tracking.live_updates')} • {t('live_tracking.last_update')}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  listItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItem: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  itemHeader: {
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
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  officeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  itemDepartment: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    color: '#4A90E2',
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  employeeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeCountText: {
    fontSize: 11,
    color: '#4A90E2',
    marginLeft: 4,
  },
  itemActions: {
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
});