import React, { useState } from 'react';
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
import { ArrowLeft, Bug, Play, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { RouteDebugger } from '@/components/RouteDebugger';

export default function DebugRoutesScreen() {
  const insets = useSafeAreaInsets();
  const [showDebugger, setShowDebugger] = useState(false);

  const testRoutes = [
    { path: '/live-tracking', name: 'Live Tracking (Direct)', protected: false },
    { path: '/live-tracking-protected', name: 'Live Tracking (Protected)', protected: true },
    { path: '/live-attendance-protected', name: 'Live Attendance', protected: true },
    { path: '/(tabs)', name: 'Main Tabs', protected: true },
    { path: '/clock-in', name: 'Clock In', protected: true },
    { path: '/attendance-history', name: 'Attendance History', protected: true },
  ];

  const handleTestRoute = (path: string) => {
    try {
      console.log(`Testing navigation to: ${path}`);
      router.push(path as any);
    } catch (error) {
      console.error(`Navigation to ${path} failed:`, error);
    }
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
          <Text style={styles.headerTitle}>Route Debugger</Text>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => setShowDebugger(true)}
          >
            <Bug size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Testing</Text>
          <Text style={styles.sectionSubtitle}>
            Test navigation to different routes to identify issues
          </Text>
          
          {testRoutes.map((route) => (
            <TouchableOpacity
              key={route.path}
              style={styles.routeCard}
              onPress={() => handleTestRoute(route.path)}
              activeOpacity={0.7}
            >
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routePath}>{route.path}</Text>
                </View>
                
                <View style={styles.routeStatus}>
                  {route.protected ? (
                    <View style={styles.protectedBadge}>
                      <Text style={styles.protectedText}>Protected</Text>
                    </View>
                  ) : (
                    <View style={styles.publicBadge}>
                      <Text style={styles.publicText}>Public</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity style={styles.testButton}>
                    <Play size={16} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Common Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Issues & Solutions</Text>
          
          <View style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <AlertTriangle size={20} color="#FF9800" />
              <Text style={styles.issueTitle}>"This screen doesn't exist"</Text>
            </View>
            <Text style={styles.issueDescription}>
              This error typically occurs when:
            </Text>
            <View style={styles.solutionsList}>
              <Text style={styles.solution}>• Route file is missing or incorrectly named</Text>
              <Text style={styles.solution}>• Component is not properly exported</Text>
              <Text style={styles.solution}>• Authentication guard is blocking access</Text>
              <Text style={styles.solution}>• Route is not registered in _layout.tsx</Text>
            </View>
          </View>

          <View style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <AlertTriangle size={20} color="#F44336" />
              <Text style={styles.issueTitle}>Map Loading Issues</Text>
            </View>
            <Text style={styles.issueDescription}>
              Map problems can be caused by:
            </Text>
            <View style={styles.solutionsList}>
              <Text style={styles.solution}>• Network connectivity issues</Text>
              <Text style={styles.solution}>• Missing map library dependencies</Text>
              <Text style={styles.solution}>• Platform compatibility problems</Text>
              <Text style={styles.solution}>• Location permission not granted</Text>
            </View>
          </View>
        </View>

        {/* Quick Fixes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Fixes</Text>
          
          <TouchableOpacity
            style={styles.fixButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.fixButtonText}>Go to Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fixButton}
            onPress={() => router.replace('/live-tracking-protected')}
          >
            <Text style={styles.fixButtonText}>Try Protected Live Tracking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RouteDebugger
        visible={showDebugger}
        onClose={() => setShowDebugger(false)}
      />
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
  debugButton: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  routePath: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  routeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  protectedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  protectedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  publicBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publicText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 8,
  },
  issueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  solutionsList: {
    marginLeft: 8,
  },
  solution: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  fixButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  fixButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});