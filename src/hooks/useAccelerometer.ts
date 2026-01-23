import { useState, useEffect, useCallback } from 'react';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { SENSOR_UPDATE_INTERVAL } from '../utils/constants';

interface AccelerometerState {
  tilt: number;
  roll: number;
  isFlat: boolean;
  isAvailable: boolean;
  error: string | null;
}

/**
 * Hook to get device tilt angle from accelerometer
 * Tilt is measured from horizontal (0° = flat, 90° = vertical)
 */
export function useAccelerometer(): AccelerometerState {
  const [state, setState] = useState<AccelerometerState>({
    tilt: 0,
    roll: 0,
    isFlat: true,
    isAvailable: false,
    error: null,
  });

  const calculateTilt = useCallback((data: AccelerometerMeasurement) => {
    const { x, y, z } = data;

    // Calculate tilt angle (pitch) - how much the device is tilted from horizontal
    // When phone is flat (screen up): z ≈ 1, x ≈ 0, y ≈ 0 → tilt ≈ 0°
    // When phone is tilted up: y increases → tilt increases
    // When phone is vertical: y ≈ 1, z ≈ 0 → tilt ≈ 90°
    
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z));
    const tiltDegrees = pitch * (180 / Math.PI);

    // Calculate roll - rotation around Y axis (side to side tilt)
    const roll = Math.atan2(x, Math.sqrt(y * y + z * z));
    const rollDegrees = roll * (180 / Math.PI);

    // Use absolute value since we care about magnitude of tilt
    const absoluteTilt = Math.abs(tiltDegrees);
    
    // Device is considered "flat" when tilt is less than 60° (good for compass accuracy)
    const isFlat = absoluteTilt < 60;

    setState((prev) => ({
      ...prev,
      tilt: Math.max(0, Math.min(90, absoluteTilt)),
      roll: rollDegrees,
      isFlat,
    }));
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!available) {
          setState((prev) => ({
            ...prev,
            isAvailable: false,
            error: 'Accelerometer not available on this device',
          }));
          return;
        }

        setState((prev) => ({ ...prev, isAvailable: true, error: null }));

        Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL);
        subscription = Accelerometer.addListener(calculateTilt);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to initialize accelerometer',
        }));
      }
    };

    setup();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [calculateTilt]);

  return state;
}
