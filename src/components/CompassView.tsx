import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import type { AlignmentStatus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getCardinalDirection } from '../utils/solarCalculations';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

interface CompassViewProps {
  currentHeading: number;
  rawHeading: number;
  targetHeading: number;
  status: AlignmentStatus;
}

const SIZE = Dimensions.get('window').width - 80;
const INNER_SIZE = SIZE - 20;
const COMPASS_SIZE = INNER_SIZE - 40;

const TICK_MARKS = Array.from({ length: 72 }, (_, i) => i * 5);

export function CompassView({ currentHeading, rawHeading, targetHeading, status }: CompassViewProps) {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(-rawHeading)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getStatusColor = () => {
    switch (status) {
      case 'best': return colors.green;
      case 'good': return colors.amber;
      case 'bad': return colors.red;
    }
  };

  const statusColor = getStatusColor();

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: -rawHeading,
      damping: 20,
      stiffness: 120,
      useNativeDriver: true,
    }).start();
  }, [rawHeading, rotation]);

  useEffect(() => {
    if (status === 'best') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const rotateStyle = {
    transform: [{
      rotate: rotation.interpolate({
        inputRange: [-36000, 0, 36000],
        outputRange: ['-36000deg', '0deg', '36000deg'],
      }),
    }],
  };

  return (
    <View style={styles.container}>
      {/* POINTING label - outside the circle */}
      <View style={styles.pointingContainer}>
        <Text style={[styles.pointingText, { color: colors.textDim }]}>POINTING</Text>
        <View style={[styles.pointingArrow, { borderTopColor: statusColor }]} />
      </View>

      {/* Fixed outer bezel */}
      <View style={[styles.outerBezel, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
        {[0, 90, 180, 270].map((deg) => (
          <View key={`bezel-${deg}`} style={[styles.bezelMark, { transform: [{ rotate: `${deg}deg` }] }]}>
            <Text style={[styles.bezelDegree, { color: colors.textDim }]}>{deg}°</Text>
          </View>
        ))}

        <Animated.View style={[
          styles.compassOuter,
          { borderColor: statusColor, backgroundColor: colors.face },
          status === 'best' && { transform: [{ scale: pulseAnim }] },
        ]}>
          <Animated.View style={[styles.compassRose, rotateStyle]}>
            {/* Tick marks */}
            {TICK_MARKS.map((deg) => {
              const isMajor = deg % 30 === 0;
              const isMinor = deg % 15 === 0 && !isMajor;
              return (
                <View key={deg} style={[styles.tickContainer, { transform: [{ rotate: `${deg}deg` }] }]}>
                  <View style={[
                    styles.tick,
                    { backgroundColor: colors.markingsDim },
                    isMajor && [styles.tickMajor, { backgroundColor: colors.markings }],
                    isMinor && [styles.tickMinor, { backgroundColor: colors.markings }],
                  ]} />
                </View>
              );
            })}

            {/* Cardinal directions */}
            {['N', 'E', 'S', 'W'].map((dir, index) => (
              <View key={dir} style={[styles.cardinalContainer, { transform: [{ rotate: `${index * 90}deg` }] }]}>
                <View style={[styles.cardinalBg, { backgroundColor: colors.face }, dir === 'N' && { backgroundColor: `${colors.amber}40` }]}>
                  <Text style={[styles.cardinal, { color: colors.markings }, dir === 'N' && { color: colors.amber }]}>{dir}</Text>
                </View>
              </View>
            ))}

            {/* Intercardinal */}
            {['NE', 'SE', 'SW', 'NW'].map((dir, index) => (
              <View key={dir} style={[styles.intercardinalContainer, { transform: [{ rotate: `${45 + index * 90}deg` }] }]}>
                <Text style={[styles.intercardinal, { color: colors.textDim }]}>{dir}</Text>
              </View>
            ))}

            {/* Target */}
            <View style={[styles.targetMarker, { transform: [{ rotate: `${targetHeading}deg` }] }]}>
              <View style={[styles.targetDot, { backgroundColor: `${colors.amber}40` }]}>
                <Text style={styles.targetLabel}>☀️</Text>
              </View>
            </View>
          </Animated.View>

          {/* Fixed needle pointing up */}
          <View style={styles.needleContainer}>
            <View style={[styles.needle, { borderBottomColor: statusColor }]} />
            <View style={[styles.needleLine, { backgroundColor: statusColor }]} />
          </View>

          {/* Center display */}
          <View style={[styles.centerDot, { backgroundColor: colors.panel }]}>
            <Text style={[styles.headingText, { color: colors.text }]}>{Math.round(currentHeading)}°</Text>
            <Text style={[styles.directionText, { color: colors.textDim }]}>{getCardinalDirection(currentHeading)}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Target info */}
      <View style={[styles.targetInfo, { backgroundColor: colors.panelLight }]}>
        <Text style={[styles.targetLabel2, { color: colors.textDim }]}>Target: </Text>
        <Text style={[styles.targetValue, { color: colors.green }]}>
          {targetHeading}° {getCardinalDirection(targetHeading)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pointingContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  pointingText: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT.medium,
  },
  pointingArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: 2,
  },
  outerBezel: {
    width: SIZE + 30,
    height: SIZE + 30,
    borderRadius: (SIZE + 30) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  bezelMark: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  bezelDegree: {
    fontSize: 9,
    marginTop: 4,
    fontFamily: FONT.regular,
  },
  compassOuter: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassRose: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tick: {
    width: 1,
    height: 6,
    marginTop: 0,
  },
  tickMajor: {
    width: 2,
    height: 14,
  },
  tickMinor: {
    height: 10,
  },
  cardinalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 18,
  },
  cardinalBg: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardinal: {
    fontSize: 18,
    fontFamily: FONT.bold,
  },
  intercardinalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  intercardinal: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  targetMarker: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  targetDot: {
    marginTop: 42,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  targetLabel: {
    fontSize: 16,
  },
  needleContainer: {
    position: 'absolute',
    top: 8,
    alignItems: 'center',
  },
  needle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleLine: {
    width: 4,
    height: 60,
    marginTop: -6,
    borderRadius: 2,
  },
  centerDot: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingText: {
    fontSize: 28,
    fontFamily: FONT.bold,
    fontVariant: ['tabular-nums'],
  },
  directionText: {
    fontSize: 14,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  targetLabel2: {
    fontSize: 14,
    fontFamily: FONT.regular,
  },
  targetValue: {
    fontSize: 14,
    fontFamily: FONT.bold,
    fontVariant: ['tabular-nums'],
  },
});
