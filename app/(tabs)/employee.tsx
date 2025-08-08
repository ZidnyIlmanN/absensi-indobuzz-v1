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
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter, Users, Clock, MapPin, Phone, Mail, UserX, X, ChevronDown, Check } from 'lucide-react-native';
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeType['status'] | ''>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');

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
    setSelectedPosition('');
    filterEmployees({});
    setShowFilterModal(false);
  }, [filterEmployees]);

  // Get unique departments and positions for filter options
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const positions = [...new Set(employees.map(emp => emp.position).filter(Boolean))];

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

  const renderEmployeeItem = (employee: EmployeeType) => (
    <TouchableOpacity
      key={employee.id}
      style={styles.employeeCard}
      activeOpacity={0.7}
      onPress={() => {
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

  const SortModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSortModal}
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Employees</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {[
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'position', label: 'Position' },
              { key: 'employee_id', label: 'Employee ID' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.sortOption}
                onPress={() => handleSort(option.key as any)}
              >
                <Text style={styles.sortOptionText}>{option.label}</Text>
                <View style={styles.sortIndicator}>
                  {sortBy === option.key && (
                    <Text style={styles.sortOrder}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Employees</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Department Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Department</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>
                  {selectedDepartment || 'All Departments'}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !selectedDepartment && styles.selectedFilterOption]}
                  onPress={() => setSelectedDepartment('')}
                >
                  <Text style={[styles.filterOptionText, !selectedDepartment && styles.selectedFilterOptionText]}>
                    All Departments
                  </Text>
                  {!selectedDepartment && <Check size={16} color="#4A90E2" />}
                </TouchableOpacity>
                
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.filterOption, selectedDepartment === dept && styles.selectedFilterOption]}
                    onPress={() => setSelectedDepartment(dept)}
                  >
                    <Text style={[styles.filterOptionText, selectedDepartment === dept && styles.selectedFilterOptionText]}>
                      {dept}
                    </Text>
                    {selectedDepartment === dept && <Check size={16} color="#4A90E2" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>
                  {selectedStatus ? getStatusText(selectedStatus) : 'All Statuses'}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !selectedStatus && styles.selectedFilterOption]}
                  onPress={() => setSelectedStatus('')}
                >
                  <Text style={[styles.filterOptionText, !selectedStatus && styles.selectedFilterOptionText]}>
                    All Statuses
                  </Text>
                  {!selectedStatus && <Check size={16} color="#4A90E2" />}
                </TouchableOpacity>
                
                {['online', 'break', 'offline'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, selectedStatus === status && styles.selectedFilterOption]}
                    onPress={() => setSelectedStatus(status as any)}
                  >
                    <View style={styles.statusFilterOption}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                      <Text style={[styles.filterOptionText, selectedStatus === status && styles.selectedFilterOptionText]}>
                        {getStatusText(status)}
                      </Text>
                    </View>
                    {selectedStatus === status && <Check size={16} color="#4A90E2" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Position Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Position</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>
                  {selectedPosition || 'All Positions'}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !selectedPosition && styles.selectedFilterOption]}
                  onPress={() => setSelectedPosition('')}
                >
                  <Text style={[styles.filterOptionText, !selectedPosition && styles.selectedFilterOptionText]}>
                    All Positions
                  </Text>
                  {!selectedPosition && <Check size={16} color="#4A90E2" />}
                </TouchableOpacity>
                
                {positions.map((position) => (
                  <TouchableOpacity
                    key={position}
                    style={[styles.filterOption, selectedPosition === position && styles.selectedFilterOption]}
                    onPress={() => setSelectedPosition(position)}
                  >
                    <Text style={[styles.filterOptionText, selectedPosition === position && styles.selectedFilterOptionText]}>
                      {position}
                    </Text>
                    {selectedPosition === position && <Check size={16} color="#4A90E2" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.applyButton} onPress={handleFilter}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
          {filteredEmployees.length} of {totalCount} employees • {workingEmployees} working
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
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearch('')}>
                <X size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color="#4A90E2" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortButtonText}>
              {sortBy === 'name' ? 'Name' : 
               sortBy === 'department' ? 'Dept' : 
               sortBy === 'position' ? 'Pos' : 'ID'}
            </Text>
            <Text style={styles.sortOrder}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={15} color="#4A90E2" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{filteredEmployees.length}</Text>
              <Text style={styles.statLabel}>Showing</Text>
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
              <Clock size={15} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{onBreakEmployees}</Text>
              <Text style={styles.statLabel}>On Break</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MapPin size={15} color="#9E9E9E" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{offlineEmployees}</Text>
              <Text style={styles.statLabel}>Offline</Text>
            </View>
          </View>
        </View>

        {/* Active Filters Display */}
        {(selectedDepartment || selectedStatus || selectedPosition || searchQuery) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
            <View style={styles.activeFilters}>
              {searchQuery && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>Search: "{searchQuery}"</Text>
                  <TouchableOpacity onPress={() => onSearch('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedDepartment && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>Dept: {selectedDepartment}</Text>
                  <TouchableOpacity onPress={() => setSelectedDepartment('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedStatus && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>Status: {getStatusText(selectedStatus)}</Text>
                  <TouchableOpacity onPress={() => setSelectedStatus('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedPosition && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>Pos: {selectedPosition}</Text>
                  <TouchableOpacity onPress={() => setSelectedPosition('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Employee List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'All Employees'}
            </Text>
            <Text style={styles.resultCount}>
              {filteredEmployees.length} result{filteredEmployees.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {isLoading ? (
            <LoadingSpinner text="Loading employees..." />
          ) : error ? (
            <EmptyState
              icon={<UserX size={48} color="#E0E0E0" />}
              title="Error loading employees"
              message={error}
              actionText="Retry"
              onAction={refreshEmployees}
            />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              icon={<UserX size={48} color="#E0E0E0" />}
              title="No employees found"
              message={
                searchQuery || selectedDepartment || selectedStatus || selectedPosition
                  ? "Try adjusting your search or filter criteria"
                  : "No employees available"
              }
              actionText={searchQuery || selectedDepartment || selectedStatus || selectedPosition ? "Clear Filters" : undefined}
              onAction={searchQuery || selectedDepartment || selectedStatus || selectedPosition ? clearFilters : undefined}
            />
          ) : (
            filteredEmployees.map(renderEmployeeItem)
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <SortModal />
      <FilterModal />
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
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  sortButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    marginRight: 4,
  },
  sortOrder: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: 'bold',
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
    padding: 12,
    marginHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  activeFiltersContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  activeFiltersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#4A90E2',
    marginRight: 4,
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
  resultCount: {
    fontSize: 12,
    color: '#666',
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
  employeeId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 10,
    color: '#999',
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
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  sortIndicator: {
    width: 20,
    alignItems: 'center',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  filterDropdownText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  filterOptions: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedFilterOption: {
    backgroundColor: '#E3F2FD',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  selectedFilterOptionText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  statusFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});