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
import { router } from 'expo-router';
import { EmployeeCard } from '@/components/EmployeeCard';
import { useI18n } from '@/hooks/useI18n';

export default function EmployeeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
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
        return t('employee.online');
      case 'break':
        return t('employee.on_break');
      case 'offline':
        return t('employee.offline');
      default:
        return t('common.na');
    }
  };

  // Calculate stats from filtered data
  const workingEmployees = filteredEmployees.filter(e => e.status === 'online').length;
  const onBreakEmployees = filteredEmployees.filter(e => e.status === 'break').length;
  const offlineEmployees = filteredEmployees.filter(e => e.status === 'offline').length;


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
            <Text style={styles.modalTitle}>{t('employee.sort_employees')}</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {[
              { key: 'name', label: t('employee.name') },
              { key: 'department', label: t('employee.department') },
              { key: 'position', label: t('employee.position') },
              { key: 'employee_id', label: t('employee.employee_id') },
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
            <Text style={styles.modalTitle}>{t('employee.filter_employees')}</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Department Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{t('employee.department')}</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>
                  {selectedDepartment || t('employee.all_departments')}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !selectedDepartment && styles.selectedFilterOption]}
                  onPress={() => setSelectedDepartment('')}
                >
                  <Text style={[styles.filterOptionText, !selectedDepartment && styles.selectedFilterOptionText]}>
                    {t('employee.all_departments')}
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
              <Text style={styles.filterLabel}>{t('home.status')}</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>
                  {selectedStatus ? getStatusText(selectedStatus) : t('employee.all_statuses')}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !selectedStatus && styles.selectedFilterOption]}
                  onPress={() => setSelectedStatus('')}
                >
                  <Text style={[styles.filterOptionText, !selectedStatus && styles.selectedFilterOptionText]}>
                    {t('employee.all_statuses')}
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
              <Text style={styles.filterLabel}>{t('employee.position')}</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>
                  {selectedPosition || t('employee.all_positions')}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !selectedPosition && styles.selectedFilterOption]}
                  onPress={() => setSelectedPosition('')}
                >
                  <Text style={[styles.filterOptionText, !selectedPosition && styles.selectedFilterOptionText]}>
                    {t('employee.all_positions')}
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
              <Text style={styles.clearButtonText}>{t('employee.clear_all')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.applyButton} onPress={handleFilter}>
              <Text style={styles.applyButtonText}>{t('employee.apply_filters')}</Text>
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
        <Text style={styles.headerTitle}>{t('employee.employee_directory')}</Text>
        <Text style={styles.headerSubtitle}>
          {filteredEmployees.length} {t('employee.of')} {totalCount} {t('employee.employees')} • {workingEmployees} {t('employee.working')}
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
              placeholder={t('employee.search_employees')}
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
              {sortBy === 'name' ? t('employee.name') : 
               sortBy === 'department' ? t('employee.dept') : 
               sortBy === 'position' ? t('employee.pos') : 'ID'}
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
              <Clock size={15} color="#4CAF50" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{workingEmployees}</Text>
              <Text style={styles.statLabel}>{t('employee.working')}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={15} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{onBreakEmployees}</Text>
              <Text style={styles.statLabel}>{t('employee.on_break')}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MapPin size={15} color="#9E9E9E" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{offlineEmployees}</Text>
              <Text style={styles.statLabel}>{t('employee.offline')}</Text>
            </View>
          </View>
        </View>

        {/* Active Filters Display */}
        {(selectedDepartment || selectedStatus || selectedPosition || searchQuery) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>{t('employee.active_filters')}</Text>
            <View style={styles.activeFilters}>
              {searchQuery && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>{t('employee.search')}: "{searchQuery}"</Text>
                  <TouchableOpacity onPress={() => onSearch('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedDepartment && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>{t('employee.dept')}: {selectedDepartment}</Text>
                  <TouchableOpacity onPress={() => setSelectedDepartment('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedStatus && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>{t('home.status')}: {getStatusText(selectedStatus)}</Text>
                  <TouchableOpacity onPress={() => setSelectedStatus('')}>
                    <X size={12} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedPosition && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>{t('employee.pos')}: {selectedPosition}</Text>
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
              {searchQuery ? t('employee.search_results') : t('employee.all_employees')}
            </Text>
            <Text style={styles.resultCount}>
              {filteredEmployees.length} {filteredEmployees.length !== 1 ? t('employee.results') : t('employee.result')}
            </Text>
          </View>
          
          {isLoading ? (
            <LoadingSpinner text={t('common.loading')} />
          ) : error ? (
            <EmptyState
              icon={<UserX size={48} color="#E0E0E0" />}
              title={t('common.error')}
              message={error}
              actionText={t('common.retry')}
              onAction={refreshEmployees}
            />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              icon={<UserX size={48} color="#E0E0E0" />}
              title={t('employee.no_employees_found')}
              message={
                searchQuery || selectedDepartment || selectedStatus || selectedPosition
                  ? t('employee.adjust_search')
                  : t('employee.no_employees_available')
              }
              actionText={searchQuery || selectedDepartment || selectedStatus || selectedPosition ? t('employee.clear_filters') : undefined}
              onAction={searchQuery || selectedDepartment || selectedStatus || selectedPosition ? clearFilters : undefined}
            />
          ) : (
            filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                showContactInfo={true}
                showNavigationArrow={true}
              />
            ))
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