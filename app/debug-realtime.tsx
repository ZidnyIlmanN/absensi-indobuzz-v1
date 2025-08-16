import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bug, Activity, Wifi, WifiOff, RefreshCw, Play, Pause, Trash2, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Users, Database } from 'lucide-react-native';
import { realTimeDebugger, useRealTimeDebugger } from '@/utils/realTimeDebugger';
import { realTimeSyncService } from '@/services/realTimeSync';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEmployees } from '@/hooks/useEmployees';

export default function DebugRealTimeScreen() {
  const insets = useSafeAreaInsets();
  const { employees } = useEmployees();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const {
    getDebugInfo,
    testConnection,
    simulateStatusUpdate,
    getEventLog,
    clearEventLog,
  } = useRealTimeDebugger();

  useEffect(() => {
    loadDebugInfo();
    loadEventLog();
  }, []);

  const loadDebugInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      Alert.alert('Error', 'Failed to load debug information');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventLog = () => {
    const log = getEventLog();
    setEventLog(log);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDebugInfo(),
      loadEventLog(),
    ]);
    setRefreshing(false);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testConnection();
      Alert.alert(
        'Connection Test',
        result.success 
          ? `Success! Latency: ${result.latency}ms`
          : `Failed: ${result.error}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateStatusUpdate = () => {
    if (employees.length === 0) {
      Alert.alert('No Employees', 'No employees available for simulation');
      return;
    }

    const testEmployee = employees[0];
    const statuses: ('online' | 'break' | 'offline')[] = ['online', 'break', 'offline'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    simulateStatusUpdate(testEmployee.id, randomStatus);
    Alert.alert(
      'Status Simulation',
      `Simulated status change for ${testEmployee.name}: ${randomStatus}`,
      [{ text: 'OK' }]
    );
  };

  const handleToggleDebugging = () => {
    if (isDebugging) {
      realTimeDebugger.stopDebugging();
      setIsDebugging(false);
    } else {
      realTimeDebugger.startDebugging();
      setIsDebugging(true);
    }
  };

  const handleClearEventLog = () => {
    clearEventLog();
    setEventLog([]);
    Alert.alert('Success', 'Event log cleared');
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <Wifi size={20} color="#4CAF50" />
    ) : (
      <WifiOff size={20} color="#F44336" />
    );
  };

  const formatEventTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Real-Time Debug</Text>
          <TouchableOpacity
            style={styles.debugToggle}
            onPress={handleToggleDebugging}
          >
            {isDebugging ? (
              <Pause size={20} color="white" />
            ) : (
              <Play size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          
          {isLoading ? (
            <LoadingSpinner text="Loading debug info..." />
          ) : debugInfo ? (
            <View style={styles.statusGrid}>
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  {getStatusIcon(debugInfo.supabaseConnection.connected)}
                  <Text style={styles.statusTitle}>Supabase</Text>
                </View>
                <Text style={styles.statusValue}>
                  {debugInfo.supabaseConnection.connected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>

              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  {getStatusIcon(debugInfo.networkStatus.online)}
                  <Text style={styles.statusTitle}>Network</Text>
                </View>
                <Text style={styles.statusValue}>
                  {debugInfo.networkStatus.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Failed to load connection info</Text>
          )}
        </View>

        {/* Real-Time Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Real-Time Events</Text>
            <TouchableOpacity onPress={handleClearEventLog} style={styles.clearButton}>
              <Trash2 size={16} color="#F44336" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          {eventLog.length > 0 ? (
            eventLog.slice(-10).map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTime}>
                    {formatEventTime(new Date(event.timestamp))}
                  </Text>
                  <Text style={styles.eventType}>{event.type}</Text>
                </View>
                <Text style={styles.eventData}>
                  {JSON.stringify(event.data, null, 2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events logged yet</Text>
          )}
        </View>

        {/* Test Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestConnection}
            disabled={isLoading}
          >
            <Activity size={16} color="white" />
            <Text style={styles.testButtonText}>Test Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleSimulateStatusUpdate}
            disabled={isLoading}
          >
            <Users size={16} color="white" />
            <Text style={styles.testButtonText}>Simulate Status Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.secondaryButton]}
            onPress={() => {
              realTimeSyncService.cleanup();
              realTimeSyncService.initialize({ enableDebugLogging: true });
              Alert.alert('Success', 'Real-time sync reinitialized');
            }}
            disabled={isLoading}
          >
            <Database size={16} color="#4A90E2" />
            <Text style={[styles.testButtonText, { color: '#4A90E2' }]}>
              Reinitialize Sync
            </Text>
          </TouchableOpacity>
        </View>

        {/* Employee Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Status Overview</Text>
          
          {employees.slice(0, 5).map((employee) => (
            <View key={employee.id} style={styles.employeeStatusItem}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeeId}>ID: {employee.employeeId}</Text>
              </View>
              
              <View style={styles.employeeStatusContainer}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(employee.status) }
                ]} />
                <Text style={styles.statusLabel}>
                  {getStatusText(employee.status)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.syncEmployeeButton}
                onPress={() => simulateStatusUpdate(
                  employee.id, 
                  employee.status === 'online' ? 'break' : 'online'
                )}
              >
                <RefreshCw size={14} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

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
      return 'Working';
    case 'break':
      return 'On Break';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
};

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
  debugToggle: {
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
  section: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 12,
    color: '#666',
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  eventType: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  eventData: {
    fontSize: 11,
    color: '#1A1A1A',
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 4,
  },
  noEventsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  testButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  employeeStatusItem: {
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
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  employeeId: {
    fontSize: 12,
    color: '#666',
  },
  employeeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  syncEmployeeButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    padding: 20,
  },
});