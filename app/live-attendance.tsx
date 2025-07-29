import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  LogIn,
  LogOut,
  Clock,
  Coffee,
  RefreshCw,
  RotateCcw,
  User,
  Users,
  Calendar,
  ChevronRight,
  List,
} from 'lucide-react-native';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  backgroundColor: string;
  route: string;
}

export default function LiveAttendanceScreen() {
  const insets = useSafeAreaInsets();

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Presensi Masuk',
      icon: <LogIn size={24} color="#4CAF50" />,
      iconColor: '#4CAF50',
      backgroundColor: '#E8F5E8',
      route: '/check-in',
    },
    {
      id: '2',
      title: 'Presensi Keluar',
      icon: <LogOut size={24} color="#F44336" />,
      iconColor: '#F44336',
      backgroundColor: '#FFEBEE',
      route: '/check-out',
    },
    {
      id: '3',
      title: 'Mulai Istirahat',
      icon: <Coffee size={24} color="#FF9800" />,
      iconColor: '#FF9800',
      backgroundColor: '#FFF3E0',
      route: '/start-break',
    },
    {
      id: '4',
      title: 'Selesai Istirahat',
      icon: <RefreshCw size={24} color="#E91E63" />,
      iconColor: '#E91E63',
      backgroundColor: '#FCE4EC',
      route: '/end-break',
    },
    {
      id: '5',
      title: 'Mulai Lembur',
      icon: <Clock size={24} color="#4CAF50" />,
      iconColor: '#4CAF50',
      backgroundColor: '#E8F5E8',
      route: '/start-overtime',
    },
    {
      id: '6',
      title: 'Selesai Lembur',
      icon: <RotateCcw size={24} color="#FF9800" />,
      iconColor: '#FF9800',
      backgroundColor: '#FFF3E0',
      route: '/end-overtime',
    },
    {
      id: '7',
      title: 'Mulai Kunjungan Klien',
      icon: <User size={24} color="#9C27B0" />,
      iconColor: '#9C27B0',
      backgroundColor: '#F3E5F5',
      route: '/start-client-visit',
    },
    {
      id: '8',
      title: 'Selesai Kunjungan Klien',
      icon: <Users size={24} color="#2196F3" />,
      iconColor: '#2196F3',
      backgroundColor: '#E3F2FD',
      route: '/end-client-visit',
    },
    {
      id: '9',
      title: 'Jadwal Shift',
      icon: <Calendar size={24} color="#4A90E2" />,
      iconColor: '#4A90E2',
      backgroundColor: '#E3F2FD',
      route: '/shift-schedule',
    },
    {
      id: '10',
      title: 'Histori Absensi',
      icon: <List size={24} color="#666" />,
      iconColor: '#666',
      backgroundColor: '#F8F9FA',
      route: '/attendance-history',
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#E91E63', '#C2185B']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kehadiran</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
              {item.icon}
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <ChevronRight size={20} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});