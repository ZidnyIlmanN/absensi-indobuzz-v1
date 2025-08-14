import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { Bug, X, RefreshCw, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { debugNavigation, testRouteAccessibility } from '@/utils/debugUtils';

interface RouteDebuggerProps {
  visible: boolean;
  onClose: () => void;
}

export function RouteDebugger({ visible, onClose }: RouteDebuggerProps) {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, user } = useAppContext();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [routeTests, setRouteTests] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (visible) {
      const info = debugNavigation(segments, isAuthenticated, false);
      setDebugInfo(info);
      runRouteTests();
    }
  }, [visible, segments, isAuthenticated]);

  const runRouteTests = async () => {
    const routesToTest = [
      'live-tracking',
      'live-tracking-protected',
      'live-attendance-protected',
      '(tabs)',
      '(auth)/login',
    ];

    const results: { [key: string]: any } = {};
    
    for (const route of routesToTest) {
      try {
        const result = await testRouteAccessibility(route);
        results[route] = result;
      } catch (error) {
        results[route] = {
          accessible: false,
          error: error instanceof Error ? error.message : 'Test failed',
          suggestions: ['Check route implementation'],
        };
      }
    }
    
    setRouteTests(results);
  };

  const handleRouteNavigation = (route: string) => {
    try {
      router.push(route as any);
      onClose();
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  if (!visible) return null;

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
              <Text style={styles.title}>Route Debugger</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Current Route Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Route</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Route:</Text>
                <Text style={styles.infoValue}>{debugInfo?.currentRoute || 'Unknown'}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Segments:</Text>
                <Text style={styles.infoValue}>{debugInfo?.segments.join(' → ') || 'None'}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Authenticated:</Text>
                <View style={styles.statusRow}>
                  {isAuthenticated ? (
                    <CheckCircle size={16} color="#4CAF50" />
                  ) : (
                    <AlertTriangle size={16} color="#F44336" />
                  )}
                  <Text style={[
                    styles.infoValue,
                    { color: isAuthenticated ? '#4CAF50' : '#F44336' }
                  ]}>
                    {isAuthenticated ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* User Info */}
            {user && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>User Info</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{user.name}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>ID:</Text>
                  <Text style={styles.infoValue}>{user.id}</Text>
                </View>
              </View>
            )}

            {/* Route Flags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route Flags</Text>
              {debugInfo?.routeFlags && Object.entries(debugInfo.routeFlags).map(([flag, value]) => (
                <View key={flag} style={styles.infoCard}>
                  <Text style={styles.infoLabel}>{flag}:</Text>
                  <View style={styles.statusRow}>
                    {value ? (
                      <CheckCircle size={16} color="#4CAF50" />
                    ) : (
                      <AlertTriangle size={16} color="#999" />
                    )}
                    <Text style={[
                      styles.infoValue,
                      { color: value ? '#4CAF50' : '#999' }
                    ]}>
                      {value ? 'True' : 'False'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Route Tests */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route Accessibility Tests</Text>
              {Object.entries(routeTests).map(([route, result]) => (
                <View key={route} style={styles.testCard}>
                  <View style={styles.testHeader}>
                    <Text style={styles.testRoute}>{route}</Text>
                    <View style={styles.statusRow}>
                      {result.accessible ? (
                        <CheckCircle size={16} color="#4CAF50" />
                      ) : (
                        <AlertTriangle size={16} color="#F44336" />
                      )}
                      <Text style={[
                        styles.testStatus,
                        { color: result.accessible ? '#4CAF50' : '#F44336' }
                      ]}>
                        {result.accessible ? 'Accessible' : 'Error'}
                      </Text>
                    </View>
                  </View>
                  
                  {result.error && (
                    <Text style={styles.testError}>{result.error}</Text>
                  )}
                  
                  {result.suggestions && result.suggestions.length > 0 && (
                    <View style={styles.suggestions}>
                      <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                      {result.suggestions.map((suggestion: string, index: number) => (
                        <Text key={index} style={styles.suggestion}>
                          • {suggestion}
                        </Text>
                      ))}
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={() => handleRouteNavigation(route)}
                  >
                    <Text style={styles.testButtonText}>Test Navigation</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={runRouteTests}
              >
                <RefreshCw size={16} color="white" />
                <Text style={styles.actionButtonText}>Rerun Tests</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  testStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  testError: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  suggestions: {
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  suggestion: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});