import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  X,
  BarChart3,
  TrendingDown,
  HardDrive,
  Image as ImageIcon,
  FileText,
  Zap,
  Info,
} from 'lucide-react-native';
import { imageCompressionService } from '@/services/imageCompressionService';
import { leaveAttachmentService } from '@/services/leaveAttachmentService';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface CompressionStatsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

interface StorageStats {
  totalFiles: number;
  totalSizeKB: number;
  imageFiles: number;
  documentFiles: number;
  compressionSavingsKB: number;
}

export function CompressionStatsModal({
  visible,
  onClose,
  userId,
}: CompressionStatsModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [compressionStats, setCompressionStats] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadStats();
    }
  }, [visible, userId]);

  const loadStats = async () => {
    setIsLoading(true);
    
    try {
      const [storageResult, compressionResult] = await Promise.all([
        leaveAttachmentService.getUserStorageUsage(userId),
        imageCompressionService.getCompressionStats(),
      ]);

      if (!storageResult.error) {
        setStorageStats({
          totalFiles: storageResult.totalFiles,
          totalSizeKB: storageResult.totalSizeKB,
          imageFiles: storageResult.imageFiles,
          documentFiles: storageResult.documentFiles,
          compressionSavingsKB: storageResult.compressionSavingsKB,
        });
      }

      setCompressionStats(compressionResult);
    } catch (error) {
      console.error('Error loading compression stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (sizeKB: number): string => {
    if (sizeKB < 1024) {
      return `${Math.round(sizeKB)} KB`;
    } else {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color = '#4A90E2' 
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

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
            <Text style={styles.title}>Compression Analytics</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner text="Loading compression statistics..." />
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Storage Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Storage Overview</Text>
                
                <View style={styles.statsGrid}>
                  <StatCard
                    icon={<HardDrive size={20} color="#4A90E2" />}
                    title="Total Storage"
                    value={formatFileSize(storageStats?.totalSizeKB || 0)}
                    subtitle={`${storageStats?.totalFiles || 0} files`}
                    color="#4A90E2"
                  />
                  
                  <StatCard
                    icon={<TrendingDown size={20} color="#4CAF50" />}
                    title="Space Saved"
                    value={formatFileSize(storageStats?.compressionSavingsKB || 0)}
                    subtitle="Through compression"
                    color="#4CAF50"
                  />
                </View>

                <View style={styles.statsGrid}>
                  <StatCard
                    icon={<ImageIcon size={20} color="#FF9800" />}
                    title="Images"
                    value={storageStats?.imageFiles.toString() || '0'}
                    subtitle="Compressed files"
                    color="#FF9800"
                  />
                  
                  <StatCard
                    icon={<FileText size={20} color="#9C27B0" />}
                    title="Documents"
                    value={storageStats?.documentFiles.toString() || '0'}
                    subtitle="Original files"
                    color="#9C27B0"
                  />
                </View>
              </View>

              {/* Compression Performance */}
              {compressionStats && compressionStats.processedCount > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Compression Performance</Text>
                  
                  <View style={styles.performanceCard}>
                    <View style={styles.performanceHeader}>
                      <Zap size={24} color="#4CAF50" />
                      <Text style={styles.performanceTitle}>Overall Efficiency</Text>
                    </View>
                    
                    <View style={styles.performanceStats}>
                      <View style={styles.performanceStat}>
                        <Text style={styles.performanceValue}>
                          {compressionStats.averageCompressionPercentage}%
                        </Text>
                        <Text style={styles.performanceLabel}>Average Reduction</Text>
                      </View>
                      
                      <View style={styles.performanceStat}>
                        <Text style={styles.performanceValue}>
                          {compressionStats.totalSavingsMB.toFixed(1)} MB
                        </Text>
                        <Text style={styles.performanceLabel}>Total Savings</Text>
                      </View>
                      
                      <View style={styles.performanceStat}>
                        <Text style={styles.performanceValue}>
                          {compressionStats.processedCount}
                        </Text>
                        <Text style={styles.performanceLabel}>Images Processed</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Compression Benefits */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Compression Benefits</Text>
                
                <View style={styles.benefitsCard}>
                  <View style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <TrendingDown size={16} color="#4CAF50" />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>Reduced Storage Costs</Text>
                      <Text style={styles.benefitDescription}>
                        Automatic compression reduces storage usage by up to 80%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <Zap size={16} color="#FF9800" />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>Faster Uploads</Text>
                      <Text style={styles.benefitDescription}>
                        Smaller files upload faster, improving user experience
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <BarChart3 size={16} color="#2196F3" />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>Optimized Quality</Text>
                      <Text style={styles.benefitDescription}>
                        Smart compression maintains visual quality while reducing size
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Technical Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Technical Details</Text>
                
                <View style={styles.technicalCard}>
                  <View style={styles.technicalHeader}>
                    <Info size={20} color="#666" />
                    <Text style={styles.technicalTitle}>Compression Settings</Text>
                  </View>
                  
                  <View style={styles.technicalDetails}>
                    <Text style={styles.technicalItem}>
                      • <Text style={styles.technicalLabel}>Quality:</Text> 80% (balanced preset)
                    </Text>
                    <Text style={styles.technicalItem}>
                      • <Text style={styles.technicalLabel}>Max Dimensions:</Text> 1200x1200px
                    </Text>
                    <Text style={styles.technicalItem}>
                      • <Text style={styles.technicalLabel}>Target Size:</Text> 500KB per image
                    </Text>
                    <Text style={styles.technicalItem}>
                      • <Text style={styles.technicalLabel}>Format:</Text> JPEG (optimized)
                    </Text>
                    <Text style={styles.technicalItem}>
                      • <Text style={styles.technicalLabel}>Progressive:</Text> Enabled for faster loading
                    </Text>
                  </View>
                </View>
              </View>

              {/* Reset Stats Button */}
              {compressionStats && compressionStats.processedCount > 0 && (
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                      imageCompressionService.resetCompressionStats();
                      loadStats();
                    }}
                  >
                    <Text style={styles.resetButtonText}>Reset Statistics</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 600,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  performanceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  technicalCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  technicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  technicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  technicalDetails: {
    gap: 8,
  },
  technicalItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  technicalLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});