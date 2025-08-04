import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Coffee, ChevronRight } from 'lucide-react-native';

interface AttendanceStatusCardProps {
  clockInTime: Date | null;
  breakStartTime: Date | null;
  attendanceStatus?: 'working' | 'break' | 'completed' | 'ready' | string;
  onPressClockIn?: () => void;
  onPressBreak?: () => void;
}

function formatElapsedTime(startTime: Date | null): string {
  if (!startTime) return '--:--:--';
  const diff = Date.now() - startTime.getTime();
  if (diff < 0) return '--:--:--';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const AttendanceStatusCard = ({
  clockInTime,
  breakStartTime,
  attendanceStatus,
  onPressClockIn,
  onPressBreak,
}: AttendanceStatusCardProps) => {
  const [elapsedClockIn, setElapsedClockIn] = useState(formatElapsedTime(clockInTime));
  const [elapsedBreak, setElapsedBreak] = useState(formatElapsedTime(breakStartTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedClockIn(formatElapsedTime(clockInTime));
      setElapsedBreak(formatElapsedTime(breakStartTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [clockInTime, breakStartTime]);

  // If attendance status is 'completed' or no clock-in time, do not render the component
  if (attendanceStatus === 'completed' || !clockInTime) {
    return null;
  }

  // Show "Istirahat" only when attendanceStatus is 'break'
  const showBreak = attendanceStatus === 'break';

  // Show "Presensi Masuk" only when attendanceStatus is 'working'
  const showClockIn = attendanceStatus === 'working';

  return (
    <View style={styles.container}>
      {/* Show Presensi Masuk */}
      {showClockIn && (
        <TouchableOpacity style={styles.row} onPress={onPressClockIn} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <ArrowLeft size={20} color="#4CAF50" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              Presensi Masuk <Text style={styles.time}>{elapsedClockIn}</Text> yang lalu
            </Text>
          </View>
          <ChevronRight size={20} color="#999" />
        </TouchableOpacity>
      )}

      {/* Show Istirahat only when attendanceStatus is 'break' */}
      {showBreak && (
        <TouchableOpacity style={styles.row} onPress={onPressBreak} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <Coffee size={20} color="#E91E63" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              Istirahat <Text style={styles.time}>{elapsedBreak}</Text> yang lalu
            </Text>
          </View>
          <ChevronRight size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDECEC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: -30,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  time: {
    fontWeight: 'bold',
    color: '#000',
  },
});
