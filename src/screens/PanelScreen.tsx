import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AlignmentMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  useAccelerometer,
  useMagnetometer,
  useLocation,
  useOptimalAngle,
  useHapticFeedback,
} from '../hooks';
import { LocationDisplay } from '../components';
import { DualAlignmentView } from '../components/DualAlignmentView';
import { ThemeToggle } from '../components/ThemeToggle';
import { CompassHelp } from '../components/CompassHelp';
import { getAlignmentResult } from '../utils/alignmentStatus';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
  display: 'ShareTechMono_400Regular',
};

interface PanelScreenProps {
  onSwitchToTilt: () => void;
  onSwitchToCompass: () => void;
}

export function PanelScreen({ onSwitchToTilt, onSwitchToCompass }: PanelScreenProps) {
  const [mode, setMode] = useState<AlignmentMode>('year-round');
  const { colors } = useTheme();

  const { tilt: currentTilt, isAvailable: accelAvailable, error: accelError } = useAccelerometer();
  const { heading: currentHeading, rawHeading, isAvailable: magAvailable, error: magError } = useMagnetometer();
  const { location, isLoading: locationLoading, isRefreshing, isCached, error: locationError, refresh } = useLocation();
  const { optimalAngles, isCalculating } = useOptimalAngle(location, mode);

  const hasTarget = optimalAngles !== null;
  const targetTilt = optimalAngles?.tilt ?? 0;
  const targetAzimuth = optimalAngles?.azimuth ?? 0;
  
  const alignmentResult = hasTarget
    ? getAlignmentResult(currentTilt, targetTilt, currentHeading, targetAzimuth)
    : null;
  
  const overallPercentage = alignmentResult
    ? Math.round((alignmentResult.tiltPercentage + alignmentResult.azimuthPercentage) / 2)
    : 0;

  const combinedDeviation = alignmentResult
    ? Math.max(
        Math.abs(alignmentResult.tiltDeviation),
        Math.abs(alignmentResult.azimuthDeviation) / 3
      )
    : 10;

  useHapticFeedback({
    enabled: accelAvailable && magAvailable && hasTarget,
    deviation: combinedDeviation,
  });

  const sensorsAvailable = accelAvailable && magAvailable;
  const sensorError = accelError || magError;
  const isLoadingTarget = locationLoading || isCalculating || !hasTarget;

  const modes: { key: AlignmentMode; label: string }[] = [
    { key: 'year-round', label: 'Year-Round' },
    { key: 'seasonal', label: 'Seasonal' },
    { key: 'daily', label: 'Daily' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.panel }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <CompassHelp />
            <Text style={[styles.title, { color: colors.amber }]}>TILTSYNC</Text>
            <ThemeToggle />
          </View>

          {/* Period Selector */}
          <View style={styles.modePanel}>
            <View style={[styles.modeButtons, { backgroundColor: colors.panelLight }]}>
              {modes.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.modeButton, mode === key && { backgroundColor: colors.border }]}
                  onPress={() => setMode(key)}
                >
                  <Text style={[
                    styles.modeButtonText,
                    { color: colors.textDim },
                    mode === key && { color: colors.green }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Main Instrument */}
          {isLoadingTarget ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.amber} />
              <Text style={[styles.loadingText, { color: colors.amber }]}>ACQUIRING POSITION...</Text>
              <Text style={[styles.loadingSubtext, { color: colors.textDim }]}>Waiting for GPS lock</Text>
            </View>
          ) : !sensorsAvailable ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.red }]}>⚠ SENSOR FAULT</Text>
              <Text style={[styles.errorSubtext, { color: colors.textDim }]}>{sensorError || 'Sensors unavailable'}</Text>
            </View>
          ) : (
            <DualAlignmentView
              currentTilt={currentTilt}
              targetTilt={targetTilt}
              currentHeading={currentHeading}
              rawHeading={rawHeading}
              targetHeading={targetAzimuth}
              tiltStatus={alignmentResult?.tiltStatus ?? 'bad'}
              azimuthStatus={alignmentResult?.azimuthStatus ?? 'bad'}
              tiltPercentage={alignmentResult?.tiltPercentage ?? 0}
              azimuthPercentage={alignmentResult?.azimuthPercentage ?? 0}
              overallPercentage={overallPercentage}
            />
          )}

          {/* View Modes */}
          <View style={styles.modesSection}>
            <Text style={[styles.modesLabel, { color: colors.textDim }]}>MODES</Text>
            <View style={[styles.controlPanel, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.controlButton} onPress={onSwitchToTilt}>
                <Text style={styles.controlIcon}>📐</Text>
                <Text style={[styles.controlLabel, { color: colors.text }]}>Tilt Only</Text>
              </TouchableOpacity>

              <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.controlButton} onPress={onSwitchToCompass}>
                <Text style={styles.controlIcon}>🧭</Text>
                <Text style={[styles.controlLabel, { color: colors.text }]}>Compass Only</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Display */}
          <View style={styles.locationPanel}>
            <LocationDisplay
              location={location}
              isLoading={locationLoading}
              isRefreshing={isRefreshing}
              isCached={isCached}
              error={locationError}
              onRefresh={refresh}
            />
          </View>

          {/* Instructions */}
          <View style={[styles.instructionsPanel, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
            <Text style={[styles.instructionsTitle, { color: colors.textDim }]}>PROCEDURE</Text>
            <Text style={[styles.instructionsText, { color: colors.text }]}>
              1. Place device flat on panel{'\n'}
              2. Align HDG to sun marker (☀){'\n'}
              3. Adjust tilt until horizon level{'\n'}
              4. Verify ALIGNED indicator
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
  title: {
    fontSize: 18,
    letterSpacing: 2,
    fontFamily: FONT.bold,
  },
  modePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    borderRadius: 4,
    padding: 2,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 3,
  },
  modeButtonText: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: FONT.regular,
  },
  loadingContainer: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 16,
    letterSpacing: 2,
    fontFamily: FONT.medium,
  },
  loadingSubtext: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONT.regular,
  },
  errorContainer: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    letterSpacing: 2,
    fontFamily: FONT.bold,
  },
  errorSubtext: {
    fontSize: 12,
    marginTop: 8,
    fontFamily: FONT.regular,
  },
  modesSection: {
    marginTop: 8,
    marginHorizontal: 20,
  },
  modesLabel: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: FONT.medium,
    marginBottom: 8,
    textAlign: 'center',
  },
  controlPanel: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  controlIcon: {
    fontSize: 18,
  },
  controlLabel: {
    fontSize: 12,
    fontFamily: FONT.regular,
  },
  controlDivider: {
    width: 1,
    marginVertical: 8,
  },
  locationPanel: {
    marginTop: 12,
  },
  instructionsPanel: {
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
