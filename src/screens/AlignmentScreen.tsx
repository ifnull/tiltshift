import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AlignmentMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  useAccelerometer,
  useLocation,
  useOptimalAngle,
  useHapticFeedback,
} from '../hooks';
import {
  ModeSelector,
  AngleDisplay,
  AlignmentIndicator,
  BubbleLevel,
  LocationDisplay,
  ThemeToggle,
} from '../components';
import { getAlignmentStatus, getAlignmentPercentage } from '../utils/alignmentStatus';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

interface AlignmentScreenProps {
  onBack: () => void;
}

export function AlignmentScreen({ onBack }: AlignmentScreenProps) {
  const [mode, setMode] = useState<AlignmentMode>('year-round');
  const { colors } = useTheme();

  const { tilt: currentAngle, isAvailable, error: accelError } = useAccelerometer();
  const { location, isLoading: locationLoading, isRefreshing, isCached, error: locationError, refresh } = useLocation();
  const { optimalAngles, isCalculating } = useOptimalAngle(location, mode);

  const hasTarget = optimalAngles !== null;
  const targetAngle = optimalAngles?.tilt ?? 0;
  const deviation = currentAngle - targetAngle;
  const status = hasTarget ? getAlignmentStatus(deviation) : 'bad';
  const percentage = hasTarget ? getAlignmentPercentage(deviation) : 0;

  useHapticFeedback({
    enabled: isAvailable && hasTarget,
    deviation: Math.abs(deviation),
  });

  const isLoadingTarget = locationLoading || isCalculating || !hasTarget;

  return (
    <View style={[styles.container, { backgroundColor: colors.panel }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.textDim }]}>‹ Panel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.amber }]}>TILT</Text>
            <ThemeToggle />
          </View>

          {/* Mode Selector */}
          <ModeSelector mode={mode} onModeChange={setMode} />

          {/* Loading state for target calculation */}
          {isLoadingTarget ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.amber} />
              <Text style={[styles.loadingText, { color: colors.amber }]}>Getting your location...</Text>
              <Text style={[styles.loadingSubtext, { color: colors.textDim }]}>
                We need your location to calculate the optimal angle
              </Text>
            </View>
          ) : !isAvailable ? (
            <View style={styles.sensorError}>
              <Text style={[styles.sensorErrorText, { color: colors.red }]}>
                {accelError || 'Accelerometer not available'}
              </Text>
              <Text style={[styles.sensorErrorHint, { color: colors.textDim }]}>
                Make sure to grant motion permissions
              </Text>
            </View>
          ) : (
            <>
              {/* Bubble Level */}
              <BubbleLevel
                currentAngle={currentAngle}
                targetAngle={targetAngle}
                status={status}
              />

              {/* Angle Display */}
              <AngleDisplay
                currentAngle={currentAngle}
                targetAngle={targetAngle}
                deviation={deviation}
              />

              {/* Alignment Indicator */}
              <AlignmentIndicator
                percentage={percentage}
                status={status}
              />
            </>
          )}

          {/* Location Display */}
          <LocationDisplay
            location={location}
            isLoading={locationLoading}
            isRefreshing={isRefreshing}
            isCached={isCached}
            error={locationError}
            onRefresh={refresh}
          />

          {/* Instructions */}
          <View style={[styles.instructions, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
            <Text style={[styles.instructionsTitle, { color: colors.textDim }]}>PROCEDURE</Text>
            <Text style={[styles.instructionsText, { color: colors.text }]}>
              1. Hold phone parallel to your solar panel{'\n'}
              2. Adjust panel angle until bubble is centered{'\n'}
              3. Green = optimal, Yellow = close, Red = adjust
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 70,
  },
  backText: {
    fontSize: 14,
    fontFamily: FONT.regular,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.bold,
    letterSpacing: 2,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 16,
    fontFamily: FONT.medium,
  },
  loadingSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FONT.regular,
  },
  sensorError: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  sensorErrorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: FONT.medium,
  },
  sensorErrorHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    fontFamily: FONT.regular,
  },
  instructions: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  instructionsTitle: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: FONT.medium,
  },
  instructionsText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: FONT.regular,
  },
});
