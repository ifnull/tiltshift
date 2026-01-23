import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatDegrees } from '../utils/solarCalculations';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

interface AngleDisplayProps {
  currentAngle: number;
  targetAngle: number;
  deviation: number;
}

export function AngleDisplay({ currentAngle, targetAngle, deviation }: AngleDisplayProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.angleBox}>
        <Text style={[styles.label, { color: colors.textDim }]}>Current</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatDegrees(currentAngle)}</Text>
      </View>

      <View style={styles.deviationBox}>
        <Text style={[styles.label, { color: colors.textDim }]}>Deviation</Text>
        <Text style={[
          styles.deviationValue,
          { color: deviation > 0 ? colors.red : colors.amber },
        ]}>
          {deviation > 0 ? '+' : ''}{formatDegrees(deviation)}
        </Text>
      </View>

      <View style={styles.angleBox}>
        <Text style={[styles.label, { color: colors.textDim }]}>Target</Text>
        <Text style={[styles.targetValue, { color: colors.green }]}>{formatDegrees(targetAngle)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  angleBox: {
    alignItems: 'center',
    flex: 1,
  },
  deviationBox: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: FONT.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontFamily: FONT.bold,
    fontVariant: ['tabular-nums'],
  },
  targetValue: {
    fontSize: 28,
    fontFamily: FONT.bold,
    fontVariant: ['tabular-nums'],
  },
  deviationValue: {
    fontSize: 20,
    fontFamily: FONT.medium,
    fontVariant: ['tabular-nums'],
  },
});
