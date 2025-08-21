import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import {
  Users,
  Wifi,
  WifiOff,
  Circle,
  Clock,
  MapPin,
  RefreshCw,
  X,
  Activity,
  Coffee,
  LogOut,
  Zap,
} from 'lucide-react-native';
import { useRealTimeStatus } from '@/hooks/useRealTimeStatus';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface RealTimeStatusIndicatorProps {
  showDetailedView?: boolean;
  compact?: boolean;
  onEmployeePress?: (employeeId: string) => void;
}

export function RealTimeStatusIndicator({
  showDetailedView = false,
  compact = false,
  onEmployeePress,
}: RealTimeStatusIndicatorProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    employees,
    statistics,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    updateMyStatus,
    refreshTeamStatus,
    forceRefresh,
    connectionStatus,
  } = useRealTimeStatus({
    enableDebugLogging: __DEV__,
    enableHeartbeat: true,
    heartbeatInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await forceRefresh();
    setRefreshing(false);
  };

  const handleStatusChange = async (status: 'online' | 'break' | 'offline' | 'away') => {
    const success = await updateMyStatus(status, 'Manual status change');
    if (!success) {
      console.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'break':
        return '#FF9800';
      case 'away':
        return '#9C27B0';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string, size: number = 16) => {
    const color = getStatusColor(status);
    switch (status) {
      case 'online':
        return <Activity size={size} color={color} />;
      case 'break':
        return <Coffee size={size} color={color} />;
      case 'away':
        return <Clock size={size} color={color} />;
      case 'offline':
        return <LogOut size={size} color={color} />;
      default:
        return <Circle size={size} color={color} />;
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.compactContent}>
          <View style={styles.connectionIndicator}>
            {isConnected ? (
              <Wifi size={12} color="#4CAF50" />
            ) : (
              <WifiOff size={12} color="#F44336" />
            )}
          </View>
          
          <View style={styles.compactStats}>
            <Text style={styles.compactNumber}>
              {statistics?.onlineCount || 0}
            </Text>
            <Text style={styles.compactLabel}>Online</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Users size={20} color="#4A90E2" />
            <Text style={styles.title}>{t('live_tracking.team_status')}</Text>
          </View>
          
          <View style={styles.connectionStatus}>
            {isConnected ? (
              <Wifi size={16} color="#4CAF50" />
            ) : (
              <WifiOff size={16} color="#F44336" />
            )}
            <Text style={[
              styles.connectionText,
              { color: isConnected ? '#4CAF50' : '#F44336' }
            ]}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        {statistics && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.statText}>{statistics.onlineCount} Online</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.statText}>{statistics.breakCount} Break</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#9E9E9E' }]} />
              <Text style={styles.statText}>{statistics.offlineCount} Offline</Text>
            </View>
          </View>
        )}

        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Updated {formatLastUpdate()}
          </Text>
        )}
      </TouchableOpacity>

      {/* Detailed Status Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Users size={24} color="#4A90E2" />
                <Text style={styles.modalTitle}>Team Status</Text>
                <View style={styles.liveIndicator}>
                  {isConnected ? (
                    <Zap size={16} color="#4CAF50" />
                  ) : (
                    <WifiOff size={16} color="#F44336" />
                  )}
                  <Text style={[
                    styles.liveText,
                    { color: isConnected ? '#4CAF50' : '#F44336' }
                  ]}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw 
                    size={20} 
                    color="#4A90E2" 
                    style={refreshing ? styles.spinning : undefined}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Statistics Summary */}
            {statistics && (
              <View style={styles.statisticsContainer}>
                <View style={styles.statisticsGrid}>
                  <View style={styles.statisticsItem}>
                    <Text style={styles.statisticsNumber}>{statistics.onlineCount}</Text>
                    <Text style={styles.statisticsLabel}>Online</Text>
                    <View style={[styles.statisticsIndicator, { backgroundColor: '#4CAF50' }]} />
                  </View>
                  
                  <View style={styles.statisticsItem}>
                    <Text style={styles.statisticsNumber}>{statistics.breakCount}</Text>
                    <Text style={styles.statisticsLabel}>Break</Text>
                    <View style={[styles.statisticsIndicator, { backgroundColor: '#FF9800' }]} />
                  </View>
                  
                  <View style={styles.statisticsItem}>
                    <Text style={styles.statisticsNumber}>{statistics.awayCount}</Text>
                    <Text style={styles.statisticsLabel}>Away</Text>
                    <View style={[styles.statisticsIndicator, { backgroundColor: '#9C27B0' }]} />
                  </View>
                  
                  <View style={styles.statisticsItem}>
                    <Text style={styles.statisticsNumber}>{statistics.offlineCount}</Text>
                    <Text style={styles.statisticsLabel}>Offline</Text>
                    <View style={[styles.statisticsIndicator, { backgroundColor: '#9E9E9E' }]} />
                  </View>
                </View>
                
                <Text style={styles.connectionInfo}>
                  {statistics.connectedCount} of {statistics.totalEmployees} connected
                </Text>
              </View>
            )}

            {/* Employee List */}
            <ScrollView 
              style={styles.employeeList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            >
              {isLoading ? (
                <LoadingSpinner text="Loading team status..." />
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : employees.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={48} color="#E0E0E0" />
                  <Text style={styles.emptyText}>No team members found</Text>
                </View>
              ) : (
                employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.employeeId}
                    style={styles.employeeItem}
                    onPress={() => onEmployeePress?.(employee.employeeId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.employeeHeader}>
                      <View style={styles.employeeAvatar}>
                        <Image
                          source={{
                            uri: employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.employeeName)}&background=4A90E2&color=fff&size=40`
                          }}
                          style={styles.avatarImage}
                        />
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusColor(employee.currentStatus) }
                          ]}
                        />
                      </View>
                      
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{employee.employeeName}</Text>
                        <Text style={styles.employeePosition}>{employee.position}</Text>
                        <Text style={styles.employeeDepartment}>{employee.department}</Text>
                      </View>
                      
                      <View style={styles.statusInfo}>
                        <View style={styles.statusBadge}>
                          {getStatusIcon(employee.currentStatus, 14)}
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(employee.currentStatus) }
                          ]}>
                            {employee.currentStatus.charAt(0).toUpperCase() + employee.currentStatus.slice(1)}
                          </Text>
                        </View>
                        
                        <Text style={styles.statusDuration}>
                          {Math.floor(employee.minutesInStatus)}m
                        </Text>
                        
                        <View style={styles.connectionIndicator}>
                          <Circle 
                            size={8} 
                            color={employee.isConnected ? '#4CAF50' : '#E0E0E0'}
                            fill={employee.isConnected ? '#4CAF50' : '#E0E0E0'}
                          />
                        </View>
                      </View>
                    </View>

                    {employee.locationAddress && (
                      <View style={styles.locationInfo}>
                        <MapPin size={12} color="#666" />
                        <Text style={styles.locationText}>{employee.locationAddress}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Quick Status Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Quick Status Update</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleStatusChange('online')}
                >
                  <Activity size={16} color="white" />
                  <Text style={styles.quickActionText}>Online</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => handleStatusChange('break')}
                >
                  <Coffee size={16} color="white" />
                  <Text style={styles.quickActionText}>Break</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#9C27B0' }]}
                  onPress={() => handleStatusChange('away')}
                >
                  <Clock size={16} color="white" />
                  <Text style={styles.quickActionText}>Away</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#9E9E9E' }]}
                  onPress={() => handleStatusChange('offline')}
                >
                  <LogOut size={16} color="white" />
                  <Text style={styles.quickActionText}>Offline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  compactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStats: {
    alignItems: 'center',
    marginLeft: 8,
  },
  compactNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  compactLabel: {
    fontSize: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  connectionIndicator: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  lastUpdate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
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
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 8,
    marginRight: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 4,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  statisticsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statisticsItem: {
    alignItems: 'center',
    position: 'relative',
  },
  statisticsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statisticsLabel: {
    fontSize: 12,
    color: '#666',
  },
  statisticsIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  employeeList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  employeeItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
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
    color: '#4A90E2',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#666',
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statusDuration: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  quickActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
});