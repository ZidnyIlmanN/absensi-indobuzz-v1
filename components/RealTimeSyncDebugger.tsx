import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Bug,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity,
  Users,
  Database,
} from 'lucide-react-native';
import { realTimeSyncService } from '@/services/realTimeSync';
import { LoadingSpinner } from './LoadingSpinner';

interface RealTimeSyncDebuggerProps {
  visible: boolean;
  onClose: () => void;
  employees: any[];
  onTriggerSync?: (employeeId?: string) => void;
}

export function RealTimeSyncDebugger({
  visible,
  onClose,
  employees,
  onTriggerSync,
}: RealTimeSyncDebuggerProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (visible) {
      loadDiagnostics();
    }
  }, [visible]);

  const loadDiagnostics = async () => {
    setIsLoading(true);
    try {
      const syncStatus = realTimeSyncService.getSyncStatus();
      
      // Get additional diagnostic info
      const diagnosticData = {
        ...syncStatus,
        employeeCount: employees.length,
        timestamp: new Date().toISOString(),
        platform: 'React Native',
        supabaseConnected: true, // Would check actual connection
      };

      setDiagnostics(diagnosticData);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectivityTest = async () => {
    setTestResults(prev => ({ ...prev, connectivity: { status: 'running' } }));
    
    try {
      // Test Supabase connection
      const { data, error } = await import('@/lib/supabase').then(module => 
        module.supabase.from('profiles').select('count').limit(1)
      );
      
      setTestResults(prev => ({
        ...prev,
        connectivity: {
          status: 'success',
          supabaseConnected: !error,
          error: error?.message,
        },
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        connectivity: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Connection test failed',
        },
      }));
    }
  };

  const runStatusSyncTest = async () => {
    if (employees.length === 0) {
      Alert.alert('No Employees', 'No employees available to test status sync');
      return;
    }

    setTestResults(prev => ({ ...prev, statusSync: { status: 'running' } }));
    
    try {
      const testEmployee = employees[0];
      const result = await realTimeSyncService.triggerStatusSync(testEmployee.id);
      
      setTestResults(prev => ({
        ...prev,
        statusSync: {
          status: result.success ? 'success' : 'error',
          employeeId: testEmployee.id,
          employeeName: testEmployee.name,
          error: result.error,
        },
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        statusSync: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Status sync test failed',
        },
      }));
    }
  };

  const runFullDiagnostic = async () => {
    setIsLoading(true);
    await Promise.all([
      loadDiagnostics(),
      runConnectivityTest(),
      runStatusSyncTest(),
    ]);
    setIsLoading(false);
  };

  const handleReinitializeSync = async () => {
    setIsLoading(true);
    try {
      realTimeSyncService.cleanup();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await realTimeSyncService.initialize({ enableDebugLogging: true });
      await loadDiagnostics();
      Alert.alert('Success', 'Real-time sync reinitialized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to reinitialize sync');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle size={16} color="#F44336" />;
      case 'running':
        return <LoadingSpinner size="small" color="#4A90E2" />;
      default:
        return <AlertTriangle size={16} color="#FF9800" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return '#4CAF50';
      case 'error':
      case 'disconnected':
        return '#F44336';
      case 'running':
        return '#4A90E2';
      default:
        return '#FF9800';
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bug size={24} color="#4A90E2" />
              <Text style={styles.title}>Real-Time Sync Debugger</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Sync Status Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync Status Overview</Text>
              
              {isLoading ? (
                <LoadingSpinner text="Loading diagnostics..." />
              ) : diagnostics ? (
                <View style={styles.statusGrid}>
                  <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                      {diagnostics.isInitialized ? (
                        <Wifi size={20} color="#4CAF50" />
                      ) : (
                        <WifiOff size={20} color="#F44336" />
                      )}
                      <Text style={[
                        styles.statusTitle,
                        { color: diagnostics.isInitialized ? '#4CAF50' : '#F44336' }
                      ]}>
                        {diagnostics.isInitialized ? 'Connected' : 'Disconnected'}
                      </Text>
                    </View>
                    <Text style={styles.statusValue}>
                      {diagnostics.subscriptionCount} active subscriptions
                    </Text>
                  </View>

                  <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                      <Users size={20} color="#4A90E2" />
                      <Text style={styles.statusTitle}>Employees</Text>
                    </View>
                    <Text style={styles.statusValue}>
                      {diagnostics.employeeCount} loaded
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.errorText}>Failed to load diagnostics</Text>
              )}
            </View>

            {/* Active Subscriptions */}
            {diagnostics && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Subscriptions</Text>
                {diagnostics.activeSubscriptions.length > 0 ? (
                  diagnostics.activeSubscriptions.map((sub: string) => (
                    <View key={sub} style={styles.subscriptionItem}>
                      <CheckCircle size={16} color="#4CAF50" />
                      <Text style={styles.subscriptionText}>{sub}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No active subscriptions</Text>
                )}
              </View>
            )}

            {/* Test Results */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              
              <View style={styles.testItem}>
                <View style={styles.testHeader}>
                  <Text style={styles.testTitle}>Connectivity Test</Text>
                  {getStatusIcon(testResults.connectivity?.status || 'pending')}
                </View>
                {testResults.connectivity?.error && (
                  <Text style={styles.testError}>{testResults.connectivity.error}</Text>
                )}
                <TouchableOpacity style={styles.testButton} onPress={runConnectivityTest}>
                  <Text style={styles.testButtonText}>Run Test</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.testItem}>
                <View style={styles.testHeader}>
                  <Text style={styles.testTitle}>Status Sync Test</Text>
                  {getStatusIcon(testResults.statusSync?.status || 'pending')}
                </View>
                {testResults.statusSync?.error && (
                  <Text style={styles.testError}>{testResults.statusSync.error}</Text>
                )}
                {testResults.statusSync?.employeeName && (
                  <Text style={styles.testInfo}>
                    Tested with: {testResults.statusSync.employeeName}
                  </Text>
                )}
                <TouchableOpacity style={styles.testButton} onPress={runStatusSyncTest}>
                  <Text style={styles.testButtonText}>Run Test</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Employee Status List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Employee Status</Text>
              {syncState.employees.slice(0, 5).map((employee) => (
                <View key={employee.id} style={styles.employeeItem}>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>{employee.name}</Text>
                    <Text style={styles.employeeId}>ID: {employee.employeeId}</Text>
                  </View>
                  <View style={styles.employeeStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(employee.status) }
                    ]} />
                    <Text style={styles.statusText}>{employee.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.syncButton}
                    onPress={() => onTriggerSync?.(employee.id)}
                  >
                    <RefreshCw size={14} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={runFullDiagnostic}
                disabled={isLoading}
              >
                <Activity size={16} color="white" />
                <Text style={styles.actionButtonText}>Run Full Diagnostic</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleReinitializeSync}
                disabled={isLoading}
              >
                <Database size={16} color="#4A90E2" />
                <Text style={[styles.actionButtonText, { color: '#4A90E2' }]}>
                  Reinitialize Sync
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.warningButton]}
                onPress={() => onTriggerSync?.()}
                disabled={isLoading}
              >
                <RefreshCw size={16} color="#FF9800" />
                <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>
                  Force Refresh All
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  content: {
    maxHeight: 600,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 12,
    color: '#666',
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  testItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  testError: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 8,
  },
  testInfo: {
    fontSize: 12,
    color: '#4A90E2',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
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
  employeeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  syncButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 6,
  },
  actionButton: {
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
  warningButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    padding: 20,
  },
});