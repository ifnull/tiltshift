import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatDegrees, getCardinalDirection } from '../utils/solarCalculations';
import type { AlignmentStatus } from '../types';

interface DualAlignmentViewProps {
  currentTilt: number;
  targetTilt: number;
  currentHeading: number;
  rawHeading: number;
  targetHeading: number;
  tiltStatus: AlignmentStatus;
  azimuthStatus: AlignmentStatus;
  tiltPercentage: number;
  azimuthPercentage: number;
  overallPercentage: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const INSTRUMENT_SIZE = Math.min(SCREEN_WIDTH - 32, 340);
const COMPASS_CARD_SIZE = INSTRUMENT_SIZE - 24;
const ATTITUDE_SIZE = INSTRUMENT_SIZE * 0.38;

// Font family for cockpit displays
const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
  display: 'ShareTechMono_400Regular',
};

export function DualAlignmentView({
  currentTilt,
  targetTilt,
  currentHeading,
  rawHeading,
  targetHeading,
  tiltStatus,
  azimuthStatus,
  tiltPercentage,
  azimuthPercentage,
  overallPercentage,
}: DualAlignmentViewProps) {
  const { colors } = useTheme();
  const compassAnim = useRef(new Animated.Value(-rawHeading)).current;
  const pitchAnim = useRef(new Animated.Value(0)).current;

  const tiltDeviation = currentTilt - targetTilt;
  const sunPosition = (targetHeading + 180) % 360;

  const getStatusColor = (status: AlignmentStatus) => {
    switch (status) {
      case 'best': return colors.green;
      case 'good': return colors.amber;
      case 'bad': return colors.red;
    }
  };

  const tiltColor = getStatusColor(tiltStatus);
  const hdgColor = getStatusColor(azimuthStatus);
  const isAligned = tiltStatus === 'best' && azimuthStatus === 'best';
  
  // Overall status color - worst of the two
  const getOverallColor = () => {
    if (tiltStatus === 'bad' || azimuthStatus === 'bad') return colors.red;
    if (tiltStatus === 'good' || azimuthStatus === 'good') return colors.amber;
    return colors.green;
  };
  const overallColor = getOverallColor();

  useEffect(() => {
    Animated.spring(compassAnim, {
      toValue: -rawHeading,
      damping: 25,
      stiffness: 120,
      useNativeDriver: true,
    }).start();
  }, [rawHeading, compassAnim]);

  useEffect(() => {
    const clampedPitch = Math.max(-45, Math.min(45, tiltDeviation));
    Animated.spring(pitchAnim, {
      toValue: clampedPitch,
      damping: 20,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [tiltDeviation, pitchAnim]);

  const compassRotate = {
    transform: [{
      rotate: compassAnim.interpolate({
        inputRange: [-36000, 0, 36000],
        outputRange: ['-36000deg', '0deg', '36000deg'],
      }),
    }],
  };

  const pitchTranslate = {
    transform: [{
      translateY: pitchAnim.interpolate({
        inputRange: [-45, 0, 45],
        outputRange: [-50, 0, 50],
      }),
    }],
  };

  // Generate compass card markings
  const renderCompassCard = () => {
    const elements = [];
    
    // Major ticks every 30° with numbers, minor every 5°
    for (let deg = 0; deg < 360; deg += 5) {
      const isMajor = deg % 30 === 0;
      const isCardinal = deg % 90 === 0;
      
      elements.push(
        <View key={`tick-${deg}`} style={[styles.tickContainer, { transform: [{ rotate: `${deg}deg` }] }]}>
          <View style={[
            styles.tick,
            { backgroundColor: colors.markings },
            isMajor && styles.tickMajor,
            !isMajor && [styles.tickMinor, { backgroundColor: colors.markingsDim }],
          ]} />
        </View>
      );

      // Numbers/Cardinals
      if (isMajor) {
        const label = isCardinal 
          ? ['N', 'E', 'S', 'W'][deg / 90]
          : (deg / 10).toString();
        
        elements.push(
          <View key={`label-${deg}`} style={[styles.labelContainer, { transform: [{ rotate: `${deg}deg` }] }]}>
            <Text style={[
              styles.compassLabel,
              { color: colors.markings },
              isCardinal && styles.cardinalLabel,
              deg === 0 && { color: colors.amber },
            ]}>
              {label}
            </Text>
          </View>
        );
      }
    }

    // Sun target marker
    elements.push(
      <View key="sun" style={[styles.sunMarkerContainer, { transform: [{ rotate: `${sunPosition}deg` }] }]}>
        <View style={[styles.sunMarker, { backgroundColor: `${colors.amber}40` }]}>
          <Text style={styles.sunIcon}>☀</Text>
        </View>
      </View>
    );

    return elements;
  };

  return (
    <View style={styles.container}>
      {/* Main Instrument */}
      <View style={[styles.instrumentBezel, { backgroundColor: colors.bezel, borderColor: colors.bezelRing }]}>
        <View style={[styles.instrumentFace, { backgroundColor: colors.face }]}>
          {/* Rotating Compass Card */}
          <Animated.View style={[styles.compassCard, compassRotate]}>
            {renderCompassCard()}
          </Animated.View>

          {/* Fixed Lubber Line (top triangle) */}
          <View style={styles.lubberLine}>
            <View style={[styles.lubberTriangle, { borderBottomColor: hdgColor }]} />
          </View>

          {/* Center Attitude Indicator */}
          <View style={[styles.attitudeBezel, { backgroundColor: colors.bezelRing }]}>
            <View style={styles.attitudeFace}>
              {/* Sky and Ground */}
              <View style={styles.attitudeClip}>
                <Animated.View style={[styles.horizonBg, pitchTranslate]}>
                  <View style={[styles.sky, { backgroundColor: colors.sky }]} />
                  <View style={[styles.horizonLine, { backgroundColor: colors.horizon }]} />
                  <View style={[styles.ground, { backgroundColor: colors.ground }]} />
                </Animated.View>
                
                {/* Pitch ladder */}
                <Animated.View style={[styles.pitchLadder, pitchTranslate]}>
                  <View style={[styles.pitchMark10, { backgroundColor: colors.horizon }]} />
                  <View style={[styles.pitchMarkCenter, { backgroundColor: colors.horizon }]} />
                  <View style={[styles.pitchMark10, { backgroundColor: colors.horizon }]} />
                </Animated.View>
              </View>

              {/* Fixed Aircraft Symbol */}
              <View style={styles.aircraftSymbol}>
                <View style={[styles.wingLeft, { backgroundColor: colors.aircraft }]} />
                <View style={[styles.fuselage, { backgroundColor: colors.aircraft }]} />
                <View style={[styles.wingRight, { backgroundColor: colors.aircraft }]} />
              </View>

              {/* Bank pointer at top */}
              <View style={[styles.bankPointer, { borderBottomColor: colors.markings }]} />
            </View>
          </View>

          {/* Heading readout box */}
          <View style={[styles.hdgReadout, { backgroundColor: `${colors.panel}dd`, borderColor: colors.bezelRing }]}>
            <Text style={[styles.hdgValue, { color: hdgColor }]}>
              {Math.round(currentHeading).toString().padStart(3, '0')}°
            </Text>
          </View>

        </View>

        {/* Status badge - bottom right outside compass */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusLed, { backgroundColor: overallColor, shadowColor: overallColor }]} />
          <Text style={[styles.statusPct, { color: overallColor }]}>{overallPercentage}%</Text>
          <Text style={[styles.statusLabel, { color: overallColor }]}>
            {isAligned ? 'ALIGNED' : (tiltStatus === 'bad' || azimuthStatus === 'bad') ? 'ADJUST' : 'CLOSE'}
          </Text>
        </View>
      </View>

      {/* Digital Readouts */}
      <View style={[styles.readoutsRow, { backgroundColor: colors.panelLight, borderColor: colors.bezelRing }]}>
        <View style={styles.readoutBox}>
          <Text style={[styles.readoutLabel, { color: colors.textDim }]}>TILT</Text>
          <Text style={[styles.readoutValue, { color: tiltColor }]}>
            {formatDegrees(currentTilt)}
          </Text>
          <Text style={[styles.readoutTarget, { color: colors.textDim }]}>Target {formatDegrees(targetTilt)}</Text>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${tiltPercentage}%`, backgroundColor: tiltColor }]} />
          </View>
        </View>

        <View style={[styles.readoutDivider, { backgroundColor: colors.bezelRing }]} />

        <View style={styles.readoutBox}>
          <Text style={[styles.readoutLabel, { color: colors.textDim }]}>HDG</Text>
          <Text style={[styles.readoutValue, { color: hdgColor }]}>
            {Math.round(currentHeading).toString().padStart(3, '0')}°
          </Text>
          <Text style={[styles.readoutTarget, { color: colors.textDim }]}>Target {sunPosition}° {getCardinalDirection(sunPosition)}</Text>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${azimuthPercentage}%`, backgroundColor: hdgColor }]} />
          </View>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  instrumentBezel: {
    width: INSTRUMENT_SIZE,
    height: INSTRUMENT_SIZE,
    borderRadius: INSTRUMENT_SIZE / 2,
    padding: 4,
    borderWidth: 3,
  },
  instrumentFace: {
    flex: 1,
    borderRadius: INSTRUMENT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  compassCard: {
    position: 'absolute',
    width: COMPASS_CARD_SIZE,
    height: COMPASS_CARD_SIZE,
  },
  tickContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  tick: {
    width: 2,
    height: 8,
    marginTop: 6,
  },
  tickMajor: {
    height: 15,
    width: 2,
  },
  tickMinor: {
    height: 8,
    width: 1,
  },
  labelContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  compassLabel: {
    marginTop: 24,
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  cardinalLabel: {
    fontSize: 18,
  },
  sunMarkerContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  sunMarker: {
    marginTop: 46,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunIcon: {
    fontSize: 16,
  },
  lubberLine: {
    position: 'absolute',
    top: 8,
  },
  lubberTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  attitudeBezel: {
    width: ATTITUDE_SIZE + 6,
    height: ATTITUDE_SIZE + 6,
    borderRadius: (ATTITUDE_SIZE + 6) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attitudeFace: {
    width: ATTITUDE_SIZE,
    height: ATTITUDE_SIZE,
    borderRadius: ATTITUDE_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attitudeClip: {
    position: 'absolute',
    width: ATTITUDE_SIZE,
    height: ATTITUDE_SIZE,
    borderRadius: ATTITUDE_SIZE / 2,
    overflow: 'hidden',
  },
  horizonBg: {
    position: 'absolute',
    width: ATTITUDE_SIZE,
    height: ATTITUDE_SIZE * 2.5,
    top: -ATTITUDE_SIZE * 0.75,
  },
  sky: {
    flex: 1,
  },
  horizonLine: {
    height: 2,
  },
  ground: {
    flex: 1,
  },
  pitchLadder: {
    position: 'absolute',
    width: ATTITUDE_SIZE * 0.6,
    height: ATTITUDE_SIZE,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
  },
  pitchMark10: {
    width: 30,
    height: 2,
  },
  pitchMarkCenter: {
    width: 50,
    height: 2,
  },
  aircraftSymbol: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  wingLeft: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },
  fuselage: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  wingRight: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },
  bankPointer: {
    position: 'absolute',
    top: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hdgReadout: {
    position: 'absolute',
    top: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  hdgValue: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'flex-end',
  },
  statusPct: {
    fontSize: 22,
    fontFamily: FONT.bold,
  },
  statusLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: FONT.medium,
    marginTop: -2,
  },
  readoutsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  readoutBox: {
    flex: 1,
    alignItems: 'center',
  },
  readoutLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: FONT.medium,
  },
  readoutValue: {
    fontSize: 20,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  readoutTarget: {
    fontSize: 10,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  readoutDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  progressBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
});
