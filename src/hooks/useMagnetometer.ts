import { useState, useEffect, useCallback, useRef } from 'react';
import { Magnetometer, MagnetometerMeasurement } from 'expo-sensors';
import { SENSOR_UPDATE_INTERVAL } from '../utils/constants';

interface MagnetometerState {
  heading: number; // 0-360 normalized for display
  rawHeading: number; // Continuous value for smooth animation
  isAvailable: boolean;
  error: string | null;
}

// Simple low-pass filter for smoothing
const SMOOTHING_FACTOR = 0.25;

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate shortest delta between two angles
 */
function shortestDelta(from: number, to: number): number {
  let delta = to - from;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/**
 * Hook to get compass heading from magnetometer
 * Returns heading in degrees (0-360, where 0 = North)
 */
export function useMagnetometer(): MagnetometerState {
  const [state, setState] = useState<MagnetometerState>({
    heading: 0,
    rawHeading: 0,
    isAvailable: false,
    error: null,
  });
  
  // Track continuous angle (can go beyond 0-360) for smooth animation
  const continuousAngleRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const calculateHeading = useCallback((data: MagnetometerMeasurement) => {
    const { x, y } = data;

    // Calculate heading from magnetometer x and y values
    let rawHeading = Math.atan2(y, x) * (180 / Math.PI);
    // Align with compass (0 = North)
    rawHeading = normalizeAngle(rawHeading - 90);

    if (!initializedRef.current) {
      // First reading - initialize
      continuousAngleRef.current = rawHeading;
      initializedRef.current = true;
    } else {
      // Calculate shortest path delta
      const delta = shortestDelta(normalizeAngle(continuousAngleRef.current), rawHeading);
      
      // Only update if change is significant (reduces jitter)
      if (Math.abs(delta) > 0.3) {
        // Apply smoothing to the continuous angle (no modulo - allows crossing 0/360 smoothly)
        continuousAngleRef.current += delta * SMOOTHING_FACTOR;
      }
    }

    // Normalize for display (0-360), but keep raw for animation
    const displayHeading = normalizeAngle(continuousAngleRef.current);
    
    // Ensure we display 0 instead of 360
    const finalDisplay = displayHeading >= 359.5 ? 0 : displayHeading;

    setState((prev) => ({
      ...prev,
      heading: finalDisplay,
      rawHeading: continuousAngleRef.current,
    }));
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const available = await Magnetometer.isAvailableAsync();
        if (!available) {
          setState((prev) => ({
            ...prev,
            isAvailable: false,
            error: 'Magnetometer not available on this device',
          }));
          return;
        }

        setState((prev) => ({ ...prev, isAvailable: true, error: null }));

        Magnetometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL);
        subscription = Magnetometer.addListener(calculateHeading);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to initialize magnetometer',
        }));
      }
    };

    setup();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [calculateHeading]);

  return state;
}
