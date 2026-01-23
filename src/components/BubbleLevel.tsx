import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import type { AlignmentStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
};

interface BubbleLevelProps {
  currentAngle: number;
  targetAngle: number;
  status: AlignmentStatus;
}

const LEVEL_WIDTH = 100;
const LEVEL_HEIGHT = Dimensions.get('window').width - 120;
const BUBBLE_SIZE = 44;

export function BubbleLevel({ currentAngle, targetAngle, status }: BubbleLevelProps) {
  const { colors } = useTheme();
  const bubblePosition = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getStatusColor = () => {
    switch (status) {
      case 'best': return colors.green;
      case 'good': return colors.amber;
      case 'bad': return colors.red;
    }
  };

  const statusColor = getStatusColor();

  useEffect(() => {
    // Convert angle deviation to vertical position
    // Positive deviation (tilted too much) = bubble moves up
    // Negative deviation (tilted too little) = bubble moves down
    const deviation = currentAngle - targetAngle;
    const maxDeviation = 30; // degrees
    const normalizedDeviation = Math.max(-maxDeviation, Math.min(maxDeviation, deviation));
    // Invert so tilting up moves bubble up
    const position = -(normalizedDeviation / maxDeviation) * ((LEVEL_HEIGHT - BUBBLE_SIZE) / 2);

    Animated.spring(bubblePosition, {
      toValue: position,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [currentAngle, targetAngle, bubblePosition]);

  useEffect(() => {
    if (status === 'best') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [status, scaleAnim]);

  return (
    <View style={styles.container}>
      {/* Labels */}
      <Text style={[styles.label, styles.topLabel, { color: colors.textDim }]}>
        Too steep ↑
      </Text>
      
      <View style={[styles.level, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
        {/* Reference markers */}
        <View style={[styles.centerMarker, { backgroundColor: colors.green }]} />
        <View style={[styles.sideMarker, styles.topMarker, { backgroundColor: colors.border }]} />
        <View style={[styles.sideMarker, styles.bottomMarker, { backgroundColor: colors.border }]} />

        {/* Bubble */}
        <Animated.View
          style={[
            styles.bubble,
            {
              backgroundColor: statusColor,
              shadowColor: statusColor,
              transform: [
                { translateY: bubblePosition },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={[styles.bubbleInner, { backgroundColor: statusColor }]} />
        </Animated.View>

        {/* Target zone indicator */}
        <View style={[styles.targetZone, { borderColor: colors.green }]} />
      </View>
      
      <Text style={[styles.label, styles.bottomLabel, { color: colors.textDim }]}>
        Too flat ↓
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  topLabel: {
    marginBottom: 8,
  },
  bottomLabel: {
    marginTop: 8,
  },
  level: {
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
    borderRadius: LEVEL_WIDTH / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  centerMarker: {
    position: 'absolute',
    width: LEVEL_WIDTH * 0.6,
    height: 4,
    borderRadius: 2,
  },
  sideMarker: {
    position: 'absolute',
    width: LEVEL_WIDTH * 0.4,
    height: 3,
    borderRadius: 1.5,
  },
  topMarker: {
    top: LEVEL_HEIGHT * 0.25,
  },
  bottomMarker: {
    bottom: LEVEL_HEIGHT * 0.25,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  bubbleInner: {
    width: BUBBLE_SIZE * 0.5,
    height: BUBBLE_SIZE * 0.5,
    borderRadius: BUBBLE_SIZE * 0.25,
    opacity: 0.6,
  },
  targetZone: {
    position: 'absolute',
    width: LEVEL_WIDTH - 16,
    height: BUBBLE_SIZE + 16,
    borderRadius: (LEVEL_WIDTH - 16) / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
