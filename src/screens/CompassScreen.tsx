import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import {
  useTiltCompensatedCompass,
  useLocation,
  useOptimalAngle,
  useHapticFeedback,
} from '../hooks';
import { AlignmentIndicator, CompassView, LocationDisplay, ThemeToggle } from '../components';
import { getAlignmentStatus, getAlignmentPercentage } from '../utils/alignmentStatus';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

interface CompassScreenProps {
  onBack: () => void;
}

export function CompassScreen({ onBack }: CompassScreenProps) {
  const { colors } = useTheme();

  const { heading: currentHeading, rawHeading, isAvailable, error: sensorError } = useTiltCompensatedCompass();
  const { location, isLoading: locationLoading, isRefreshing, isCached, error: locationError, refresh } = useLocation();
  // Mode and algorithm don't affect azimuth, so we just use defaults
  const { optimalAngles, isCalculating } = useOptimalAngle(location, 'year-round', 'simple');

  // For compass only mode, the user stands behind the panel
  // pointing the phone in the direction the panel should face
  // Northern hemisphere: panel faces South (180°)
  // Southern hemisphere: panel faces North (0°)
  const hasTarget = optimalAngles !== null;
  const panelFacingDirection = optimalAngles ? (optimalAngles.azimuth + 180) % 360 : 180;
  const targetHeading = panelFacingDirection;
  
  // Calculate deviation for alignment
  const deviation = ((currentHeading - targetHeading + 180) % 360) - 180;
  const status = hasTarget ? getAlignmentStatus(deviation / 3) : 'bad';
  const percentage = hasTarget ? getAlignmentPercentage(deviation / 3) : 0;

  useHapticFeedback({
    enabled: isAvailable && hasTarget,
    deviation: Math.abs(deviation) / 3,
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
            <Text style={[styles.title, { color: colors.amber }]}>COMPASS</Text>
            <ThemeToggle />
          </View>

          {/* Loading state for target calculation */}
          {isLoadingTarget ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.amber} />
              <Text style={[styles.loadingText, { color: colors.amber }]}>Getting your location...</Text>
              <Text style={[styles.loadingSubtext, { color: colors.textDim }]}>
                We need your location to calculate the optimal direction
              </Text>
            </View>
          ) : !isAvailable ? (
            <View style={styles.sensorError}>
              <Text style={[styles.sensorErrorText, { color: colors.red }]}>
                {sensorError || 'Compass not available'}
              </Text>
              <Text style={[styles.sensorErrorHint, { color: colors.textDim }]}>
                Make sure to grant compass permissions
              </Text>
            </View>
          ) : (
            <>
              {/* Compass View */}
              <CompassView
                currentHeading={currentHeading}
                rawHeading={rawHeading}
                targetHeading={targetHeading}
                status={status}
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
              1. Stand behind your panel{'\n'}
              2. Point phone in direction panel faces{'\n'}
              3. Rotate panel until needle points to ☀️{'\n'}
              4. Haptic feedback intensifies as you align
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
    height: 350,
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
    height: 300,
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
