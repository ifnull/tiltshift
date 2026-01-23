import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { LocationData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { triggerSelectionHaptic } from '../hooks/useHapticFeedback';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return 'now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface LocationDisplayProps {
  location: LocationData | null;
  isLoading: boolean;
  isRefreshing?: boolean;
  isCached?: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function LocationDisplay({ 
  location, 
  isLoading, 
  isRefreshing = false,
  isCached = false,
  error,
  onRefresh,
}: LocationDisplayProps) {
  const { colors } = useTheme();
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    if (!location?.timestamp) return;

    const updateTime = () => {
      setRelativeTime(getRelativeTime(location.timestamp));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, [location?.timestamp]);

  const handleRefresh = async () => {
    if (onRefresh) {
      await triggerSelectionHaptic();
      onRefresh();
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
        <Text style={[styles.errorText, { color: colors.red }]}>⚠ GPS ERROR: {error}</Text>
      </View>
    );
  }

  if (isLoading && !location) {
    return (
      <View style={[styles.container, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.amber} size="small" />
          <Text style={[styles.loadingText, { color: colors.amber }]}>Acquiring GPS...</Text>
        </View>
      </View>
    );
  }

  if (!location) return null;

  const formatCoord = (value: number, isLat: boolean) => {
    const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(4)}° ${dir}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
      {/* Row 1: Coordinates */}
      <View style={styles.coordsRow}>
        <View style={[styles.statusLed, { backgroundColor: isRefreshing ? colors.amber : colors.green }]} />
        <Text style={[styles.coordValue, { color: colors.green }]}>{formatCoord(location.latitude, true)}</Text>
        <Text style={[styles.coordSeparator, { color: colors.textDim }]}>•</Text>
        <Text style={[styles.coordValue, { color: colors.green }]}>{formatCoord(location.longitude, false)}</Text>
        {location.altitude !== null && (
          <>
            <Text style={[styles.coordSeparator, { color: colors.textDim }]}>•</Text>
            <Text style={[styles.coordValue, { color: colors.green }]}>{Math.round(location.altitude)}m</Text>
          </>
        )}
      </View>

      {/* Row 2: Updated time and refresh */}
      <View style={styles.footerRow}>
        {relativeTime && (
          <Text style={[styles.timeText, { color: colors.textDim }]}>Updated {relativeTime}</Text>
        )}
        {onRefresh && (
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Text style={[styles.refreshText, { color: colors.textDim }]}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  coordValue: {
    fontSize: 12,
    fontFamily: FONT.regular,
    fontVariant: ['tabular-nums'],
  },
  coordSeparator: {
    fontSize: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 12,
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  refreshButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  refreshText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    textDecorationLine: 'underline',
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FONT.regular,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.regular,
    textAlign: 'center',
  },
});
