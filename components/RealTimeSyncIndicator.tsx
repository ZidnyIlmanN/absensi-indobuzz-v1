import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Wifi,
  WifiOff,
  Activity,
  RefreshCw,
  Bug,
  X,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
} from 'lucide-react-native';
import { realTimeSyncService } from '@/services/realTimeSync';
import { statusSyncDebugger, SyncDebugInfo } from '@/services/statusSyncDebugger';

interface RealTimeSyncIndicatorProps {
  style?: any;
  showDebugButton?: boolean;
}

export function RealTimeSyncIndicator({ 
  style, 
  showDebugButton = false 
}: RealTimeSyncIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState(realTimeSyncService.getConnectionStatus());
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugLogs, setDebugLogs] = useState<SyncDebugInfo[]>([]);
  const [isTestingSync, setIsTestingSync] = useState(false);

  useEffect(() => {
    // Update connection status every 5 seconds
    const interval = setInterval(() => {
      setConnectionStatus(realTimeSyncService.getConnectionStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDebugTest = async () => {
    setIsTestingSync(true);
    
    try {
      const results = await statusSyncDebugger.testAllEmployeesSync();
      setDebugLogs(results);
    } catch (error) {
      console.error('Debug test failed:', error);
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleForceRefresh = async () => {
    try {
      await realTimeSyncService.forceRefresh();
      setDebugLogs(statusSyncDebugger.getDebugLogs());
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
  };

  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? '#4CAF50' : '#F44336';
  };

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <Wifi size={16} color="#4CAF50" />
    ) : (
      <WifiOff size={16} color="#F44336" />
    );
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.statusIndicator}>
          {getStatusIcon(connectionStatus.isConnected)}
          <Text style={[
            styles.statusText,
            { color: getStatusColor(connectionStatus.isConnected) }
          ]}>
            {connectionStatus.isConnected ? 'Live' : 'Offline'}
          </Text>
        </View>

        {showDebugButton && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => setShowDebugModal(true)}
          >
            <Bug size={14} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Debug Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDebugModal}
        onRequestClose={() => setShowDebugModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Real-time Sync Debug</Text>
              <TouchableOpacity onPress={() => setShowDebugModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Connection Status */}
              <View style={styles.debugSection}>
                <Text style={styles.debugSectionTitle}>Connection Status</Text>
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Connected:</Text>
                  <View style={styles.debugValue}>
                    {getStatusIcon(connectionStatus.isConnected)}
                    <Text style={[
                      styles.debugValueText,
                      { color: getStatusColor(connectionStatus.isConnected) }
                    ]}>
                      {connectionStatus.isConnected ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Reconnect Attempts:</Text>
                  <Text style={styles.debugValueText}>{connectionStatus.reconnectAttempts}</Text>
                </View>
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Active Subscriptions:</Text>
                  <Text style={styles.debugValueText}>{connectionStatus.activeSubscriptions}</Text>
                </View>
              </View>

              {/* Test Actions */}
              <View style={styles.debugSection}>
                <Text style={styles.debugSectionTitle}>Test Actions</Text>
                <View style={styles.debugActions}>
                  <TouchableOpacity
                    style={styles.debugActionButton}
                    onPress={handleDebugTest}
                    disabled={isTestingSync}
                  >
                    <Activity size={16} color="white" />
                    <Text style={styles.debugActionText}>
                      {isTestingSync ? 'Testing...' : 'Test Sync'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.debugActionButton}
                    onPress={handleForceRefresh}
                  >
                    <RefreshCw size={16} color="white" />
                    <Text style={styles.debugActionText}>Force Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Debug Logs */}
              {debugLogs.length > 0 && (
                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>
                    Recent Tests ({debugLogs.length})
                  </Text>
                  {debugLogs.slice(0, 10).map((log, index) => (
                    <View key={index} style={styles.debugLogItem}>
                      <View style={styles.debugLogHeader}>
                        <Text style={styles.debugLogUser}>{log.userName}</Text>
                        <View style={styles.debugLogStatus}>
                          {log.expectedStatus === log.actualStatus ? (
                            <CheckCircle size={14} color="#4CAF50" />
                          ) : (
                            <AlertTriangle size={14} color="#F44336" />
                          )}
                          <Text style={styles.debugLogLatency}>
                            {log.syncLatency}ms
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.debugLogDetails}>
                        <Text style={styles.debugLogDetail}>
                          Expected: {log.expectedStatus} | Actual: {log.actualStatus}
                        </Text>
                        {log.errors.length > 0 && (
                          <Text style={styles.debugLogError}>
                            Errors: {log.errors.join(', ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  debugButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    elevation: 8,
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
    maxHeight: 400,
  },
  debugSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  debugSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  debugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  debugLabel: {
    fontSize: 14,
    color: '#666',
  },
  debugValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugValueText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 4,
  },
  debugActions: {
    flexDirection: 'row',
    gap: 12,
  },
  debugActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  debugActionText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  debugLogItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  debugLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  debugLogUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  debugLogStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugLogLatency: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  debugLogDetails: {
    marginTop: 4,
  },
  debugLogDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  debugLogError: {
    fontSize: 12,
    color: '#F44336',
  },
});