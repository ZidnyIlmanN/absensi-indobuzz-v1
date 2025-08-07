import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter, Users, Clock, MapPin, Phone, Mail, UserX, Import as SortAsc, Dessert as SortDesc, X, ChevronDown, Building, Badge, Calendar } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee as EmployeeType } from '@/types';

export default function EmployeeScreen() {
  const insets = useSafeAreaInsets();
  const { 
    employees, 
    filteredEmployees, 
    totalCount, 
    activeCount, 
    searchQuery, 
    sortBy, 
    sortOrder, 
    isLoading, 
    error, 
    searchEmployees, 
    refreshEmployees,
    setSortOptions,
    filterEmployees,
    clearSearch,
  } = useEmployees();
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeType['status'] | ''>('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshEmployees();
    setRefreshing(false);
  }, [refreshEmployees]);

  const onSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      await searchEmployees(query);
    } else {
      clearSearch();
    }
  }, [searchEmployees, clearSearch]);

  const handleSort = useCallback((field: typeof sortBy) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOptions(field, newOrder);
    setShowSortModal(false);
  }, [sortBy, sortOrder, setSortOptions]);

  const handleFilter = useCallback(() => {
    filterEmployees({
      department: selectedDepartment || undefined,
      status: selectedStatus || undefined,
    });
    setShowFilterModal(false);
  }, [selectedDepartment, selectedStatus, filterEmployees]);

  const clearFilters = useCallback(() => {
    setSelectedDepartment('');
    setSelectedStatus('');
    filterEmployees({});
    setShowFilterModal(false);
  }, [filterEmployees]);

  // Get unique departments for filter
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

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
        return 'Working';
      case 'break':
        return 'On Break';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  // Calculate stats from filtered data
  const workingEmployees = filteredEmployees.filter(e => e.status === 'online').length;
  const onBreakEmployees = filteredEmployees.filter(e => e.status === 'break').length;
  const offlineEmployees = filteredEmployees.filter(e => e.status === 'offline').length;

  const renderEmployeeItem = ({ item: employee }: { item: EmployeeType }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to employee detail screen if needed
        Alert.alert(
          employee.name,
          `Employee ID: ${employee.employeeId}\nDepartment: ${employee.department}\nPosition: ${employee.position}`,
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.employeeHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=50`
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
          <Text style={styles.employeeId}>ID: {employee.employeeId}</Text>
          <Text style={styles.employeePosition}>{employee.position || 'No position'}</Text>
          <Text style={styles.employeeDepartment}>{employee.department || 'No department'}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(employee.status) }
          ]}>
            {getStatusText(employee.status)}
          </Text>
          {employee.joinDate && (
            <Text style={styles.joinDate}>
              Joined: {new Date(employee.joinDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.employeeDetails}>
        <View style={styles.detailItem}>
          <Clock size={14} color="#666" />
          <Text style={styles.detailText}>{employee.workHours || '09:00-18:00'}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <MapPin size={14} color="#666" />
          <Text style={styles.detailText}>{employee.location || 'No location'}</Text>
        </View>
      </View>
      
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Phone size={14} color="#4A90E2" />
          <Text style={styles.contactText}>{employee.phone || 'No phone'}</Text>
        </View>
        
        <View style={styles.contactItem}>
          <Mail size={14} color="#4A90E2" />
          <Text style={styles.contactText}>{employee.email || 'No email'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Employee Directory</Text>
        <Text style={styles.headerSubtitle}>
          {totalEmployees} employees • {workingEmployees} online
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              value={searchQuery}
              onChangeText={onSearch}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={15} color="#4A90E2" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{totalEmployees}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={15} color="#4CAF50" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{workingEmployees}</Text>
              <Text style={styles.statLabel}>Working</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MapPin size={15} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{remoteEmployees}</Text>
              <Text style={styles.statLabel}>Remote</Text>
            </View>
          </View>
        </View>

        {/* Employee List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Employees</Text>
          
          {isLoading ? (
            <LoadingSpinner text="Loading employees..." />
          ) : error ? (
            <EmptyState
              icon={<UserX size={48} color="#E0E0E0" />}
              title="Error loading employees"
              message={error}
            />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              icon={<UserX size={48} color="#E0E0E0" />}
              title="No employees found"
              message={searchQuery ? "Try adjusting your search terms" : "No employees available"}
            />
          ) : (
            filteredEmployees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.employeeCard}
              activeOpacity={0.7}
            >
              <View style={styles.employeeHeader}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={{ 
                      uri: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=4A90E2&color=fff&size=50`
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
                  <Text style={styles.employeePosition}>{employee.position || 'No position'}</Text>
                  <Text style={styles.employeeDepartment}>{employee.department || 'No department'}</Text>
                </View>
                
                <View style={styles.statusContainer}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(employee.status) }
                  ]}>
                    {getStatusText(employee.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.employeeDetails}>
                <View style={styles.detailItem}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.detailText}>{employee.workHours || '09:00-18:00'}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MapPin size={14} color="#666" />
                  <Text style={styles.detailText}>{employee.location || 'No location'}</Text>
                </View>
              </View>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Phone size={14} color="#4A90E2" />
                  <Text style={styles.contactText}>{employee.phone || 'No phone'}</Text>
                </View>
                
                <View style={styles.contactItem}>
                  <Mail size={14} color="#4A90E2" />
                  <Text style={styles.contactText}>{employee.email || 'No email'}</Text>
                </View>
              </View>
            </TouchableOpacity>
            ))
          )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#1A1A1A',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  employeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  contactInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4,
  },
});