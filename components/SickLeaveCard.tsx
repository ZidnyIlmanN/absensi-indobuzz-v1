import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Heart, Clock, FileText, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, ChevronRight } from 'lucide-react-native';
import { SickLeaveRequest } from '@/services/sickLeave';
import { useI18n } from '@/hooks/useI18n';

interface SickLeaveCardProps {
  request: SickLeaveRequest;
  onPress: (request: SickLeaveRequest) => void;
  showActions?: boolean;
}

export function SickLeaveCard({
  request,
  onPress,
  showActions = true,
}: SickLeaveCardProps) {
  const { t, formatLeaveDateShort } = useI18n();
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'rejected':
        return <XCircle size={16} color="#F44336" />;
      case 'pending':
        return <AlertCircle size={16} color="#FF9800" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(request)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateInfo}>
            <Heart size={16} color="#F44336" />
            <Text style={styles.dateText}>{formatLeaveDateShort(request.selectedDate)}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.statusContainer}>
              {getStatusIcon(request.status)}
              <Text style={[
                styles.statusText,
                { color: getStatusColor(request.status) }
              ]}>
                {t(`sick_leave.${request.status}`)}
              </Text>
            </View>
            
            {showActions && (
              <ChevronRight size={16} color="#C7C7CC" />
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.requestMeta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {t('sick_leave.sick_leave')}
              </Text>
            </View>
            
            <View style={styles.durationInfo}>
              <Clock size={14} color="#666" />
              <Text style={styles.durationText}>
                {t('sick_leave.single_day')}
              </Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {request.reason}
          </Text>

          {/* Attachments indicator */}
          {request.attachments.length > 0 && (
            <View style={styles.attachmentsIndicator}>
              <FileText size={14} color="#F44336" />
              <Text style={styles.attachmentsText}>
                {t('sick_leave.attachments', { count: request.attachments.length })}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.submittedDate}>
            {t('sick_leave.submitted')}: {formatLeaveDateShort(request.submittedAt.toISOString().split('T')[0])}
          </Text>
          
          {request.reviewedAt && (
            <Text style={styles.reviewedDate}>
              {t('sick_leave.reviewed')}: {formatLeaveDateShort(request.reviewedAt.toISOString().split('T')[0])}
            </Text>
          )}
        </View>

        {/* Tap indicator */}
        <View style={styles.tapIndicator}>
          <Text style={styles.tapIndicatorText}>{t('attendance.tap_to_view_details')}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    marginBottom: 12,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  attachmentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  attachmentsText: {
    fontSize: 11,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 8,
  },
  submittedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  reviewedDate: {
    fontSize: 12,
    color: '#666',
  },
  tapIndicator: {
    alignItems: 'center',
  },
  tapIndicatorText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});