import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface ConnectionStatusProps {
  style?: any;
  showDetails?: boolean;
}

/**
 * Real-time connection status indicator
 * Shows the current state of Supabase real-time connection
 */
export function RealtimeConnectionStatus({ style, showDetails = false }: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'OPEN' | 'CLOSED'>('CONNECTING');
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [showDetailedStatus, setShowDetailedStatus] = useState(showDetails);

  useEffect(() => {
    // Monitor Supabase real-time connection status
    const channel = supabase.channel('connection-monitor');
    
    // Listen to connection state changes
    channel.on('system', {}, (payload) => {
      console.log('🔄 [RealtimeConnectionStatus] Connection state:', payload);
      
      if (payload.status) {
        setConnectionState(payload.status);
        
        if (payload.status === 'OPEN') {
          setLastPing(new Date());
        }
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('🔄 [RealtimeConnectionStatus] Subscription status:', status);
      setConnectionState(status === 'SUBSCRIBED' ? 'OPEN' : 'CONNECTING');
      
      if (status === 'SUBSCRIBED') {
        setLastPing(new Date());
      }
    });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Periodic ping to check connection health
  useEffect(() => {
    const pingInterval = setInterval(async () => {
      try {
        // Simple query to test connection
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (!error) {
          setLastPing(new Date());
          if (connectionState !== 'OPEN') {
            setConnectionState('OPEN');
          }
        } else {
          console.warn('🔄 [RealtimeConnectionStatus] Ping failed:', error);
          setConnectionState('CLOSED');
        }
      } catch (error) {
        console.warn('🔄 [RealtimeConnectionStatus] Ping error:', error);
        setConnectionState('CLOSED');
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [connectionState]);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'OPEN':
        return '#4CAF50';
      case 'CONNECTING':
        return '#FF9800';
      case 'CLOSED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'OPEN':
        return <Wifi size={12} color={getStatusColor()} />;
      case 'CONNECTING':
        return <Activity size={12} color={getStatusColor()} />;
      case 'CLOSED':
        return <WifiOff size={12} color={getStatusColor()} />;
      default:
        return <AlertCircle size={12} color={getStatusColor()} />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'OPEN':
        return 'Connected';
      case 'CONNECTING':
        return 'Connecting...';
      case 'CLOSED':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatLastPing = () => {
    if (!lastPing) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastPing.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    return lastPing.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => setShowDetailedStatus(!showDetailedStatus)}
      activeOpacity={0.7}
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        {getStatusIcon()}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {showDetailedStatus && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Last sync: {formatLastPing()}
          </Text>
          <Text style={styles.detailText}>
            Real-time updates: {connectionState === 'OPEN' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'center',
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
});