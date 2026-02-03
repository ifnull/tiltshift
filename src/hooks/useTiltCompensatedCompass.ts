import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Magnetometer, Accelerometer, MagnetometerMeasurement, AccelerometerMeasurement } from 'expo-sensors';
import { SENSOR_UPDATE_INTERVAL } from '../utils/constants';

interface CompassState {
  heading: number; // 0-360 normalized for display
  rawHeading: number; // Continuous value for smooth animation
  tilt: number; // Device tilt in degrees (0 = flat, 90 = vertical)
  roll: number; // Side-to-side tilt
  isAvailable: boolean;
  error: string | null;
}

// Smoothing factors - Android tends to have noisier sensors
const SMOOTHING_FACTOR = Platform.OS === 'android' ? 0.15 : 0.25;
const TILT_SMOOTHING = 0.3;

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
 * Normalize a 3D vector
 */
function normalize(x: number, y: number, z: number): [number, number, number] {
  const mag = Math.sqrt(x * x + y * y + z * z);
  if (mag === 0) return [0, 0, 0];
  return [x / mag, y / mag, z / mag];
}

/**
 * Cross product of two 3D vectors
 */
function cross(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number
): [number, number, number] {
  return [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx
  ];
}

/**
 * Dot product of two 3D vectors
 */
function dot(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  return ax * bx + ay * by + az * bz;
}

/**
 * Calculate tilt-compensated compass heading
 * 
 * This algorithm works by:
 * 1. Using the accelerometer to determine the gravity vector (which way is "down")
 * 2. Using the magnetometer to get the magnetic field vector
 * 3. Computing the East vector as the cross product of magnetic field and gravity
 * 4. Computing the North vector as the cross product of gravity and East
 * 5. Projecting the device's forward direction onto this horizontal plane to get heading
 */
function calculateTiltCompensatedHeading(
  accel: AccelerometerMeasurement,
  mag: MagnetometerMeasurement
): number {
  // Normalize accelerometer to get gravity vector
  // In expo-sensors coordinate system:
  // - x: right (positive = right side down)
  // - y: up/forward (positive = top of device up when tilted)
  // - z: out of screen (positive = screen facing up)
  const [gx, gy, gz] = normalize(accel.x, accel.y, accel.z);
  
  // Get magnetometer values
  const mx = mag.x;
  const my = mag.y;
  const mz = mag.z;
  
  // Calculate East vector: E = M × G (cross product of magnetic field and gravity)
  // This gives us a vector pointing East (perpendicular to both magnetic north and gravity)
  let [ex, ey, ez] = cross(mx, my, mz, gx, gy, gz);
  [ex, ey, ez] = normalize(ex, ey, ez);
  
  // Calculate North vector: N = G × E (cross product of gravity and East)
  // This gives us a vector pointing North in the horizontal plane
  let [nx, ny, nz] = cross(gx, gy, gz, ex, ey, ez);
  [nx, ny, nz] = normalize(nx, ny, nz);
  
  // The device's forward direction is the Y axis (top of phone)
  // We want to find the heading by projecting this onto our North-East plane
  // 
  // For a phone lying flat with top pointing North: heading = 0
  // We compute the angle between the device's Y axis projection and North
  
  // Project device Y axis onto horizontal plane and measure angle from North
  // Device Y axis in device coordinates is (0, 1, 0)
  // Heading = atan2(dot(Y, E), dot(Y, N))
  const headingRad = Math.atan2(ey, ny);
  let headingDeg = headingRad * (180 / Math.PI);
  
  // Convert to compass bearing (0 = North, 90 = East, etc.)
  // The raw calculation gives us the angle, but we need to adjust for compass convention
  headingDeg = normalizeAngle(-headingDeg);
  
  return headingDeg;
}

/**
 * Hook to get tilt-compensated compass heading
 * Combines accelerometer and magnetometer data for accurate heading at any tilt angle
 */
export function useTiltCompensatedCompass(): CompassState {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    rawHeading: 0,
    tilt: 0,
    roll: 0,
    isAvailable: false,
    error: null,
  });
  
  // Store latest sensor readings
  const accelRef = useRef<AccelerometerMeasurement | null>(null);
  const magRef = useRef<MagnetometerMeasurement | null>(null);
  
  // Track continuous angle for smooth animation
  const continuousAngleRef = useRef<number>(0);
  const smoothedTiltRef = useRef<number>(0);
  const smoothedRollRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const updateHeading = useCallback(() => {
    const accel = accelRef.current;
    const mag = magRef.current;
    
    if (!accel || !mag) return;
    
    // Calculate tilt (pitch) from accelerometer
    const pitch = Math.atan2(accel.y, Math.sqrt(accel.x * accel.x + accel.z * accel.z));
    const tiltDegrees = Math.abs(pitch * (180 / Math.PI));
    
    // Calculate roll from accelerometer
    const roll = Math.atan2(accel.x, Math.sqrt(accel.y * accel.y + accel.z * accel.z));
    const rollDegrees = roll * (180 / Math.PI);
    
    // Smooth tilt and roll
    smoothedTiltRef.current += (tiltDegrees - smoothedTiltRef.current) * TILT_SMOOTHING;
    smoothedRollRef.current += (rollDegrees - smoothedRollRef.current) * TILT_SMOOTHING;
    
    // Calculate tilt-compensated heading
    const rawHeading = calculateTiltCompensatedHeading(accel, mag);
    
    if (!initializedRef.current) {
      continuousAngleRef.current = rawHeading;
      initializedRef.current = true;
    } else {
      // Calculate shortest path delta
      const delta = shortestDelta(normalizeAngle(continuousAngleRef.current), rawHeading);
      
      // Only update if change is significant (reduces jitter)
      if (Math.abs(delta) > 0.3) {
        continuousAngleRef.current += delta * SMOOTHING_FACTOR;
      }
    }

    // Normalize for display (0-360)
    const displayHeading = normalizeAngle(continuousAngleRef.current);
    const finalDisplay = displayHeading >= 359.5 ? 0 : displayHeading;

    setState((prev) => ({
      ...prev,
      heading: finalDisplay,
      rawHeading: continuousAngleRef.current,
      tilt: Math.max(0, Math.min(90, smoothedTiltRef.current)),
      roll: smoothedRollRef.current,
    }));
  }, []);

  const handleAccelerometer = useCallback((data: AccelerometerMeasurement) => {
    accelRef.current = data;
    updateHeading();
  }, [updateHeading]);

  const handleMagnetometer = useCallback((data: MagnetometerMeasurement) => {
    magRef.current = data;
    updateHeading();
  }, [updateHeading]);

  useEffect(() => {
    let accelSubscription: { remove: () => void } | null = null;
    let magSubscription: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const [accelAvailable, magAvailable] = await Promise.all([
          Accelerometer.isAvailableAsync(),
          Magnetometer.isAvailableAsync(),
        ]);
        
        if (!accelAvailable) {
          setState((prev) => ({
            ...prev,
            isAvailable: false,
            error: 'Accelerometer not available on this device',
          }));
          return;
        }
        
        if (!magAvailable) {
          setState((prev) => ({
            ...prev,
            isAvailable: false,
            error: 'Magnetometer not available on this device',
          }));
          return;
        }

        setState((prev) => ({ ...prev, isAvailable: true, error: null }));

        // Set update intervals
        Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL);
        Magnetometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL);
        
        // Subscribe to both sensors
        accelSubscription = Accelerometer.addListener(handleAccelerometer);
        magSubscription = Magnetometer.addListener(handleMagnetometer);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to initialize sensors',
        }));
      }
    };

    setup();

    return () => {
      if (accelSubscription) accelSubscription.remove();
      if (magSubscription) magSubscription.remove();
    };
  }, [handleAccelerometer, handleMagnetometer]);

  return state;
}
