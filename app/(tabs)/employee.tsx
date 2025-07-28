import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Filter,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react-native';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  status: 'online' | 'offline' | 'break';
  workHours: string;
  location: string;
  phone: string;
  email: string;
}

const employees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    position: 'Software Engineer',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'online',
    workHours: '08:30 - 17:30',
    location: 'Jakarta Office',
    phone: '+62 812-3456-7890',
    email: 'john.doe@company.com',
  },
  {
    id: '2',
    name: 'Jane Smith',
    position: 'Product Manager',
    department: 'Product',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'break',
    workHours: '09:00 - 18:00',
    location: 'Remote',
    phone: '+62 813-4567-8901',
    email: 'jane.smith@company.com',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    position: 'UI/UX Designer',
    department: 'Design',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'offline',
    workHours: '08:00 - 17:00',
    location: 'Bandung Office',
    phone: '+62 814-5678-9012',
    email: 'mike.johnson@company.com',
  },
];

export default function EmployeeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Employee Directory</Text>
        <Text style={styles.headerSubtitle}>
          {employees.length} employees • {employees.filter(e => e.status === 'online').length} online
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              value={searchQuery}
              onChangeText={setSearchQuery}
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
              <Users size={20} color="#4A90E2" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{employees.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={20} color="#4CAF50" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{employees.filter(e => e.status === 'online').length}</Text>
              <Text style={styles.statLabel}>Working</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MapPin size={20} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{employees.filter(e => e.location === 'Remote').length}</Text>
              <Text style={styles.statLabel}>Remote</Text>
            </View>
          </View>
        </View>

        {/* Employee List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Employees</Text>
          
          {filteredEmployees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.employeeCard}
              activeOpacity={0.7}
            >
              <View style={styles.employeeHeader}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: employee.avatar }} style={styles.avatar} />
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
                  <Text style={styles.employeeDepartment}>{employee.department}</Text>
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
                  <Text style={styles.detailText}>{employee.workHours}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MapPin size={14} color="#666" />
                  <Text style={styles.detailText}>{employee.location}</Text>
                </View>
              </View>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Phone size={14} color="#4A90E2" />
                  <Text style={styles.contactText}>{employee.phone}</Text>
                </View>
                
                <View style={styles.contactItem}>
                  <Mail size={14} color="#4A90E2" />
                  <Text style={styles.contactText}>{employee.email}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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