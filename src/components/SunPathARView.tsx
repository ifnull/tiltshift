import React, { useMemo } from 'react';
import { Platform, View, Text, StyleSheet, requireNativeComponent } from 'react-native';
import type { SunPosition } from '../types';

export interface ArcData {
  positions: SunPosition[];
  label: string;
  isPrimary: boolean;
  colorKey: 'today' | 'summer' | 'equinox' | 'winter';
}

export interface BandData {
  upperPositions: SunPosition[];
  lowerPositions: SunPosition[];
  colorKey: 'annual' | 'warm' | 'cool';
}

interface NativeSunPathARViewProps {
  sunPositions: string;
  bandData: string;
  currentHour: number;
  optimalAzimuth: number;
  optimalTilt: number;
  style?: object;
}

const NativeSunPathARView =
  Platform.OS === 'ios'
    ? requireNativeComponent<NativeSunPathARViewProps>('SunPathARView')
    : null;

interface SunPathARViewProps {
  arcs: ArcData[];
  band?: BandData | null;
  currentHour: number;
  optimalAzimuth: number;
  optimalTilt: number;
  style?: object;
}

export function SunPathARView({
  arcs,
  band,
  currentHour,
  optimalAzimuth,
  optimalTilt,
  style,
}: SunPathARViewProps) {
  const serializedArcs = useMemo(
    () => JSON.stringify(arcs),
    [arcs],
  );

  const serializedBand = useMemo(
    () => (band ? JSON.stringify(band) : ''),
    [band],
  );

  if (!NativeSunPathARView) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          AR Sun Path is only available on iOS devices with ARKit support.
        </Text>
      </View>
    );
  }

  return (
    <NativeSunPathARView
      style={style}
      sunPositions={serializedArcs}
      bandData={serializedBand}
      currentHour={currentHour}
      optimalAzimuth={optimalAzimuth}
      optimalTilt={optimalTilt}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    padding: 32,
  },
  fallbackText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
