import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AlignmentStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

interface AlignmentIndicatorProps {
  percentage: number;
  status: AlignmentStatus;
}

export function AlignmentIndicator({ percentage, status }: AlignmentIndicatorProps) {
  const { colors } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'best': return colors.green;
      case 'good': return colors.amber;
      case 'bad': return colors.red;
    }
  };

  const statusColor = getStatusColor();
  const statusLabel = status === 'best' ? 'Aligned' : status === 'good' ? 'Close' : 'Adjust';

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.barFill,
              { width: `${percentage}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.percentage, { color: statusColor }]}>
          {percentage}%
        </Text>
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  barContainer: {
    marginBottom: 8,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 16,
    fontFamily: FONT.bold,
    fontVariant: ['tabular-nums'],
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: FONT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
