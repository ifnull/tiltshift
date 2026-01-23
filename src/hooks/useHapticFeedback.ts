import { useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { HAPTIC_THRESHOLDS, HAPTIC_INTERVALS } from '../utils/constants';

type HapticIntensity = 'none' | 'approaching' | 'close' | 'very_close' | 'locked';

interface HapticFeedbackOptions {
  enabled?: boolean;
  deviation: number;
  lockThreshold?: number;
}

/**
 * Hook to provide proximity-based haptic feedback
 * Pulses increase in frequency as deviation approaches zero
 */
export function useHapticFeedback({
  enabled = true,
  deviation,
  lockThreshold = 0.5,
}: HapticFeedbackOptions): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIntensityRef = useRef<HapticIntensity>('none');
  const isLockedRef = useRef(false);

  const getIntensity = useCallback(
    (dev: number): HapticIntensity => {
      const absDev = Math.abs(dev);

      if (absDev <= lockThreshold) {
        return 'locked';
      } else if (absDev <= HAPTIC_THRESHOLDS.VERY_CLOSE) {
        return 'very_close';
      } else if (absDev <= HAPTIC_THRESHOLDS.CLOSE) {
        return 'close';
      } else if (absDev <= HAPTIC_THRESHOLDS.APPROACHING) {
        return 'approaching';
      }
      return 'none';
    },
    [lockThreshold]
  );

  const triggerHaptic = useCallback(async (intensity: HapticIntensity) => {
    try {
      switch (intensity) {
        case 'locked':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'very_close':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'close':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'approaching':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        default:
          break;
      }
    } catch {
      // Haptics may not be available on all devices
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const intensity = getIntensity(deviation);

    // Handle locked state - single confirmation haptic
    if (intensity === 'locked' && !isLockedRef.current) {
      isLockedRef.current = true;
      triggerHaptic('locked');
      
      // Clear any running interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset locked state when moving away
    if (intensity !== 'locked') {
      isLockedRef.current = false;
    }

    // Only update interval if intensity changed
    if (intensity !== lastIntensityRef.current) {
      lastIntensityRef.current = intensity;

      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Set up new interval based on intensity
      const intervalMs =
        intensity === 'very_close'
          ? HAPTIC_INTERVALS.VERY_CLOSE
          : intensity === 'close'
          ? HAPTIC_INTERVALS.CLOSE
          : intensity === 'approaching'
          ? HAPTIC_INTERVALS.APPROACHING
          : null;

      if (intervalMs) {
        // Immediate feedback on intensity change
        triggerHaptic(intensity);

        intervalRef.current = setInterval(() => {
          triggerHaptic(intensity);
        }, intervalMs);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, deviation, getIntensity, triggerHaptic]);
}

/**
 * Simple haptic feedback trigger for UI interactions
 */
export async function triggerSelectionHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics may not be available
  }
}
