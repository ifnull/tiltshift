import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AlignmentMode, CalculationAlgorithm } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  useTiltCompensatedCompass,
  useLocation,
  useOptimalAngle,
  useHapticFeedback,
  usePVWattsLive,
} from '../hooks';
import { LocationDisplay } from '../components';
import { DualAlignmentView } from '../components/DualAlignmentView';
import { ThemeToggle } from '../components/ThemeToggle';
import { CompassHelp } from '../components/CompassHelp';
import { getAlignmentResult } from '../utils/alignmentStatus';
import { ALGORITHMS, calculateAllAlgorithms, getCurrentSeason, getHemisphere, getDailyTilt } from '../utils/solarCalculations';
import { SEASONAL_ADJUSTMENT } from '../utils/constants';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
  display: 'ShareTechMono_400Regular',
};

interface PanelScreenProps {
  onSwitchToTilt: () => void;
  onSwitchToCompass: () => void;
  onSwitchToSettings: () => void;
}

export function PanelScreen({ onSwitchToTilt, onSwitchToCompass, onSwitchToSettings }: PanelScreenProps) {
  const [mode, setMode] = useState<AlignmentMode>('year-round');
  const [showAlgorithmPicker, setShowAlgorithmPicker] = useState(false);
  const { 
    colors, 
    algorithm, 
    setAlgorithm, 
    pvwattsLiveEnabled,
    useManualLocation,
    manualLatitude,
    manualLongitude,
  } = useTheme();

  // Combined tilt-compensated compass - accurate at any device angle
  const { 
    heading: currentHeading, 
    rawHeading, 
    tilt: currentTilt, 
    isAvailable: sensorsAvailable, 
    error: sensorError 
  } = useTiltCompensatedCompass();
  const { location: gpsLocation, isLoading: locationLoading, isRefreshing, isCached, error: locationError, refresh } = useLocation();
  
  // Determine effective location (manual overrides GPS when enabled and valid)
  const location = React.useMemo(() => {
    if (useManualLocation && manualLatitude !== null && manualLongitude !== null) {
      return {
        latitude: manualLatitude,
        longitude: manualLongitude,
        altitude: null,
        accuracy: 0,
        timestamp: Date.now(),
      };
    }
    return gpsLocation;
  }, [useManualLocation, manualLatitude, manualLongitude, gpsLocation]);
  
  const isUsingManualLocation = useManualLocation && manualLatitude !== null && manualLongitude !== null;
  
  const { optimalAngles, isCalculating, isLive } = useOptimalAngle(location, mode, algorithm);
  
  // Fetch PVWatts Live data in background when enabled
  const { tilt: pvwattsLiveBaseTilt, isLoading: pvwattsLoading } = usePVWattsLive(location, pvwattsLiveEnabled, false);
  
  // Fetch Winter Priority data in background when enabled
  const { tilt: winterPriorityBaseTilt, isLoading: winterPriorityLoading } = usePVWattsLive(location, pvwattsLiveEnabled, true);
  
  // Adjust PVWatts Live tilt based on current mode (same logic as other algorithms)
  const pvwattsLiveTilt = React.useMemo(() => {
    if (pvwattsLiveBaseTilt === null || !location) return null;
    
    if (mode === 'daily') {
      // Daily mode uses sun position, not the base algorithm tilt
      return getDailyTilt(location.latitude);
    }
    
    if (mode === 'seasonal') {
      const hemisphere = getHemisphere(location.latitude);
      const season = getCurrentSeason(new Date(), hemisphere);
      
      switch (season) {
        case 'summer':
          return Math.max(0, pvwattsLiveBaseTilt - SEASONAL_ADJUSTMENT);
        case 'winter':
          return Math.min(90, pvwattsLiveBaseTilt + SEASONAL_ADJUSTMENT);
        default:
          return pvwattsLiveBaseTilt;
      }
    }
    
    // Year-round mode: use raw tilt
    return pvwattsLiveBaseTilt;
  }, [pvwattsLiveBaseTilt, location, mode]);

  // Adjust Winter Priority tilt based on current mode
  // Note: Winter Priority is already optimized for worst-month, so seasonal adjustment
  // may not be ideal - but we show it for consistency with other algorithms
  const winterPriorityTilt = React.useMemo(() => {
    if (winterPriorityBaseTilt === null || !location) return null;
    
    if (mode === 'daily') {
      // Daily mode uses sun position, not the base algorithm tilt
      return getDailyTilt(location.latitude);
    }
    
    if (mode === 'seasonal') {
      const hemisphere = getHemisphere(location.latitude);
      const season = getCurrentSeason(new Date(), hemisphere);
      
      switch (season) {
        case 'summer':
          return Math.max(0, winterPriorityBaseTilt - SEASONAL_ADJUSTMENT);
        case 'winter':
          return Math.min(90, winterPriorityBaseTilt + SEASONAL_ADJUSTMENT);
        default:
          return winterPriorityBaseTilt;
      }
    }
    
    // Year-round mode: use raw tilt (this is the primary use case for Winter Priority)
    return winterPriorityBaseTilt;
  }, [winterPriorityBaseTilt, location, mode]);

  const hasTarget = optimalAngles !== null;
  const targetTilt = optimalAngles?.tilt ?? 0;
  const targetAzimuth = optimalAngles?.azimuth ?? 0;
  
  // Calculate tilts for all algorithms (for picker display) based on current mode
  const allAlgorithmTilts = location ? calculateAllAlgorithms(location.latitude, mode) : null;
  
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
    enabled: sensorsAvailable && hasTarget,
    deviation: combinedDeviation,
  });

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
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.panelLight, borderColor: colors.border }]}
              onPress={onSwitchToSettings}
            >
              <Text style={[styles.settingsButtonText, { color: colors.amber }]}>⚙</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.amber }]}>TILTSYNC</Text>
            <View style={styles.headerRight}>
              <CompassHelp />
              <ThemeToggle />
            </View>
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
              isLoading={locationLoading && !isUsingManualLocation}
              isRefreshing={isRefreshing && !isUsingManualLocation}
              isCached={isCached}
              isManual={isUsingManualLocation}
              error={isUsingManualLocation ? null : locationError}
              onRefresh={isUsingManualLocation ? undefined : refresh}
            />
          </View>

          {/* Algorithm Selector */}
          <View style={styles.algorithmSection}>
            <Text style={[styles.algorithmLabel, { color: colors.textDim }]}>FORMULA</Text>
            <TouchableOpacity
              style={[styles.algorithmDropdown, { backgroundColor: colors.panelLight, borderColor: colors.border }]}
              onPress={() => setShowAlgorithmPicker(true)}
            >
              <Text style={[styles.algorithmDropdownText, { color: isLive ? colors.green : colors.text }]}>
                {ALGORITHMS.find(a => a.id === algorithm)?.name ?? 'Select Formula'}
              </Text>
              <Text style={[styles.algorithmDropdownArrow, { color: colors.textDim }]}>▼</Text>
            </TouchableOpacity>
            <Text style={[styles.algorithmDescription, { color: isLive ? colors.green : colors.textDim }]}>
              {isLive ? '⚡ Live data from NREL PVWatts API' : ALGORITHMS.find(a => a.id === algorithm)?.description}
            </Text>
          </View>

          {/* Algorithm Picker Modal */}
          <Modal
            visible={showAlgorithmPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAlgorithmPicker(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAlgorithmPicker(false)}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Formula</Text>
                
                {/* Mode info note */}
                <View style={[styles.modalInfoNote, { backgroundColor: colors.panelLight, borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalInfoNoteTitle, { color: colors.text }]}>
                    {mode === 'daily' ? '📍 Daily Mode Active' : mode === 'seasonal' ? '🌡️ Seasonal Mode Active' : '📐 Year-Round Mode'}
                  </Text>
                  <Text style={[styles.modalInfoNoteText, { color: colors.textDim }]}>
                    {mode === 'daily' 
                      ? 'Daily mode tracks the sun\'s position in real-time. All formulas show the same angle based on current sun altitude.'
                      : mode === 'seasonal'
                      ? 'Seasonal mode adjusts the base formula ±15° for summer/winter. Values shown reflect the current season.'
                      : 'Year-round mode uses the selected formula directly for optimal annual energy production.'
                    }
                  </Text>
                </View>
                
                {ALGORITHMS.map((algo) => {
                  // Check if this is a live API algorithm
                  const isPvwattsLive = algo.id === 'pvwatts-live';
                  const isWinterPriority = algo.id === 'pvwatts-winter';
                  const isLiveApiAlgorithm = isPvwattsLive || isWinterPriority;
                  
                  // Get the calculated tilt for this algorithm
                  const algoTilt = isLiveApiAlgorithm
                    ? null 
                    : allAlgorithmTilts?.[algo.id as keyof typeof allAlgorithmTilts];
                  
                  // Live API algorithms are disabled when PVWatts Live is not enabled
                  const isDisabled = isLiveApiAlgorithm && !pvwattsLiveEnabled;
                  
                  // Get the live tilt value for API algorithms
                  const liveTilt = isPvwattsLive ? pvwattsLiveTilt : isWinterPriority ? winterPriorityTilt : null;
                  const isLoadingLive = isPvwattsLive ? pvwattsLoading : isWinterPriority ? winterPriorityLoading : false;
                  
                  return (
                    <TouchableOpacity
                      key={algo.id}
                      style={[
                        styles.modalOption,
                        { borderBottomColor: colors.border },
                        algorithm === algo.id && { backgroundColor: colors.panelLight },
                        isDisabled && styles.modalOptionDisabled
                      ]}
                      onPress={() => {
                        if (!isDisabled) {
                          setAlgorithm(algo.id);
                          setShowAlgorithmPicker(false);
                        }
                      }}
                      activeOpacity={isDisabled ? 1 : 0.7}
                    >
                      <View style={styles.modalOptionHeader}>
                        <Text style={[
                          styles.modalOptionName,
                          { color: colors.text },
                          algorithm === algo.id && { color: colors.green },
                          isDisabled && { color: colors.textDim }
                        ]}>
                          {algo.name}
                        </Text>
                        <View style={styles.modalOptionRight}>
                          {algoTilt !== null && algoTilt !== undefined && (
                            <Text style={[styles.modalOptionTilt, { color: colors.amber }]}>
                              {algoTilt.toFixed(1)}°
                            </Text>
                          )}
                          {isLiveApiAlgorithm && pvwattsLiveEnabled && (
                            <Text style={[styles.modalOptionTilt, { color: colors.amber }]}>
                              {isLoadingLive ? '...' : liveTilt !== null ? `${liveTilt.toFixed(1)}°` : 'Live'}
                            </Text>
                          )}
                          {algorithm === algo.id && (
                            <Text style={[styles.modalCheckmark, { color: colors.green }]}>✓</Text>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.modalOptionFormula, { color: colors.textDim }]}>
                        {isDisabled ? 'Enable in Settings (⚙) to use live API data' : algo.formula}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: colors.panelLight }]}
                  onPress={() => setShowAlgorithmPicker(false)}
                >
                  <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

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
  settingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  settingsButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    letterSpacing: 2,
    fontFamily: FONT.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  algorithmSection: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  algorithmLabel: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: FONT.medium,
    marginBottom: 8,
    textAlign: 'center',
  },
  algorithmDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  algorithmDropdownText: {
    fontSize: 14,
    fontFamily: FONT.regular,
  },
  algorithmDropdownArrow: {
    fontSize: 12,
  },
  algorithmDescription: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: FONT.regular,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: 1,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalOptionDisabled: {
    opacity: 0.5,
  },
  modalOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionName: {
    fontSize: 14,
    fontFamily: FONT.medium,
    flex: 1,
  },
  modalOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOptionTilt: {
    fontSize: 14,
    fontFamily: FONT.display,
    minWidth: 48,
    textAlign: 'right',
  },
  modalCheckmark: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  modalOptionFormula: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 4,
  },
  modalInfoNote: {
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  modalInfoNoteTitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginBottom: 4,
  },
  modalInfoNoteText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    lineHeight: 16,
  },
  modalCloseButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: FONT.medium,
  },
});
