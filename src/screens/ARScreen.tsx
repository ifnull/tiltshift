import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AlignmentMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../hooks';
import { SunPathARView } from '../components/SunPathARView';
import type { ArcData, BandData } from '../components/SunPathARView';
import {
  getSunPathPositions,
  getSunPathPositionsFull,
  getOptimalAzimuth,
  getSolarDeclination,
  getSolarAltitude,
  getSolarAzimuth,
  getHourAngle,
  getDayOfYear,
  getCurrentSeason,
  getHemisphere,
  formatDegrees,
  getCardinalDirection,
  clockToSolarOffsetHours,
} from '../utils/solarCalculations';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
  display: 'ShareTechMono_400Regular',
};

interface ARScreenProps {
  mode: AlignmentMode;
  onBack: () => void;
}

const MODE_LABELS: Record<AlignmentMode, string> = {
  daily: 'DAILY',
  seasonal: 'SEASONAL',
  'year-round': 'YEAR-ROUND',
};

function makeDate(month: number, day: number): Date {
  const d = new Date();
  d.setMonth(month - 1, day);
  d.setHours(12, 0, 0, 0);
  return d;
}

const SOLSTICE_SUMMER = makeDate(6, 21);
const EQUINOX = makeDate(3, 20);
const SOLSTICE_WINTER = makeDate(12, 21);

export function ARScreen({ mode, onBack }: ARScreenProps) {
  const { colors, useManualLocation, manualLatitude, manualLongitude } = useTheme();
  const { location: gpsLocation } = useLocation();

  const location = useMemo(() => {
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

  // Tick once per minute so currentHour updates smoothly without flooding the
  // native view with re-renders on every React tick.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(tick), [tick]);
  const currentHour = useMemo(
    () => now.getHours() + now.getMinutes() / 60,
    [now],
  );

  const arcs: ArcData[] = useMemo(() => {
    if (!location) return [];
    const lat = location.latitude;
    const lng = location.longitude;

    if (mode === 'daily') {
      return [{
        positions: getSunPathPositions(lat, lng, now),
        label: 'Today',
        isPrimary: true,
        colorKey: 'today',
      }];
    }

    const summerPositions = getSunPathPositions(lat, lng, SOLSTICE_SUMMER);
    const equinoxPositions = getSunPathPositions(lat, lng, EQUINOX);
    const winterPositions = getSunPathPositions(lat, lng, SOLSTICE_WINTER);

    if (mode === 'seasonal') {
      const hemisphere = getHemisphere(lat);
      const season = getCurrentSeason(now, hemisphere);
      const isSummer = season === 'summer';
      const isWinter = season === 'winter';

      return [
        { positions: summerPositions, label: 'Jun 21', isPrimary: isSummer, colorKey: 'summer' },
        { positions: equinoxPositions, label: 'Equinox', isPrimary: !isSummer && !isWinter, colorKey: 'equinox' },
        { positions: winterPositions, label: 'Dec 21', isPrimary: isWinter, colorKey: 'winter' },
      ];
    }

    // year-round: equinox is primary (annual average)
    return [
      { positions: summerPositions, label: 'Jun 21', isPrimary: false, colorKey: 'summer' },
      { positions: equinoxPositions, label: 'Equinox', isPrimary: true, colorKey: 'equinox' },
      { positions: winterPositions, label: 'Dec 21', isPrimary: false, colorKey: 'winter' },
    ];
  }, [location?.latitude, location?.longitude, now.toDateString(), mode]);

  // Envelope band — a translucent surface showing the range of possible sun
  // positions throughout the period. Daily mode has no band (it's a single arc).
  const band: BandData | null = useMemo(() => {
    if (!location) return null;
    if (mode === 'daily') return null;
    const lat = location.latitude;
    const lng = location.longitude;

    // Use the "full hours" sampler (clamps altitude to ≥ 0) so both boundaries
    // share the same hour indices and can form a well-paired triangle strip.
    const summerFull = getSunPathPositionsFull(lat, lng, SOLSTICE_SUMMER);
    const equinoxFull = getSunPathPositionsFull(lat, lng, EQUINOX);
    const winterFull = getSunPathPositionsFull(lat, lng, SOLSTICE_WINTER);

    if (mode === 'year-round') {
      return {
        upperPositions: summerFull,
        lowerPositions: winterFull,
        colorKey: 'annual',
      };
    }

    // Seasonal: band spans the current half-year's bounds (warm or cool).
    const hemisphere = getHemisphere(lat);
    const season = getCurrentSeason(now, hemisphere);
    const isWarmHalf = season === 'spring' || season === 'summer';

    return {
      upperPositions: isWarmHalf ? summerFull : equinoxFull,
      lowerPositions: isWarmHalf ? equinoxFull : winterFull,
      colorKey: isWarmHalf ? 'warm' : 'cool',
    };
  }, [location?.latitude, location?.longitude, now.toDateString(), mode]);

  const optimalAz = location ? getOptimalAzimuth(location.latitude) : 0;

  const currentSun = useMemo(() => {
    if (!location) return null;
    const dayOfYear = getDayOfYear(now);
    const declination = getSolarDeclination(dayOfYear);
    const solarHour = currentHour + clockToSolarOffsetHours(location.longitude, now);
    const hourAngle = getHourAngle(solarHour);
    const altitude = getSolarAltitude(location.latitude, declination, hourAngle);
    if (altitude <= 0) return null;
    const azimuth = getSolarAzimuth(location.latitude, declination, hourAngle, altitude);
    return { altitude, azimuth };
  }, [location?.latitude, location?.longitude, currentHour, now]);

  const optimalTilt = location ? Math.abs(location.latitude) : 0;

  return (
    <View style={styles.container}>
      <SunPathARView
        arcs={arcs}
        band={band}
        currentHour={currentHour}
        optimalAzimuth={optimalAz}
        optimalTilt={optimalTilt}
        style={styles.arView}
      />

      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: colors.border }]}
            onPress={onBack}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={[styles.titleBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Text style={[styles.titleText, { color: colors.amber }]}>AR SUN PATH</Text>
            <Text style={[styles.modeTag, { color: colors.textDim }]}>
              {MODE_LABELS[mode]}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom info panel */}
        <View style={[styles.infoPanel, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          {currentSun ? (
            <View style={styles.infoRow}>
              {/* Sun position group */}
              <View style={styles.infoGroup}>
                <Text style={[styles.groupHeader, { color: colors.amber }]}>
                  SUN NOW
                </Text>
                <View style={styles.groupRow}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textDim }]}>
                      HEIGHT
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.amber }]}>
                      {formatDegrees(currentSun.altitude, 0)}
                    </Text>
                    <Text style={[styles.infoHint, { color: colors.textDim }]}>
                      above horizon
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textDim }]}>
                      BEARING
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.amber }]}>
                      {formatDegrees(currentSun.azimuth, 0)} {getCardinalDirection(currentSun.azimuth)}
                    </Text>
                    <Text style={[styles.infoHint, { color: colors.textDim }]}>
                      compass direction
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />

              {/* Optimal panel group */}
              <View style={styles.infoGroupSingle}>
                <Text style={[styles.groupHeader, { color: colors.green }]}>
                  PANEL
                </Text>
                <View style={styles.groupRow}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textDim }]}>
                      TILT
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.green }]}>
                      {formatDegrees(optimalTilt, 0)}
                    </Text>
                    <Text style={[styles.infoHint, { color: colors.textDim }]}>
                      from flat
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Text style={[styles.sunBelowText, { color: colors.amber }]}>
              Sun is below the horizon
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  arView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  titleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    letterSpacing: 2,
    fontFamily: 'RobotoMono_700Bold',
  },
  modeTag: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: 'RobotoMono_500Medium',
    marginTop: 2,
  },
  infoPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoGroup: {
    flex: 2,
    alignItems: 'center',
  },
  infoGroupSingle: {
    flex: 1,
    alignItems: 'center',
  },
  groupHeader: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'RobotoMono_700Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  infoLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: 'RobotoMono_500Medium',
    textAlign: 'center',
    height: 12,
    lineHeight: 12,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'ShareTechMono_400Regular',
    textAlign: 'center',
    height: 20,
    lineHeight: 20,
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 9,
    fontFamily: 'RobotoMono_400Regular',
    textAlign: 'center',
    lineHeight: 12,
    opacity: 0.7,
  },
  groupDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  sunBelowText: {
    fontSize: 13,
    fontFamily: 'RobotoMono_500Medium',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
