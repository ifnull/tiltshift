import type { AlignmentStatus, AlignmentResult } from '../types';
import { TILT_THRESHOLDS, AZIMUTH_THRESHOLDS, STATUS_COLORS } from './constants';

/**
 * Get alignment status based on deviation
 */
export function getTiltStatus(deviation: number): AlignmentStatus {
  const absDeviation = Math.abs(deviation);
  if (absDeviation <= TILT_THRESHOLDS.BEST) {
    return 'best';
  } else if (absDeviation <= TILT_THRESHOLDS.GOOD) {
    return 'good';
  }
  return 'bad';
}

/**
 * Get azimuth alignment status based on deviation
 */
export function getAzimuthStatus(deviation: number): AlignmentStatus {
  const absDeviation = Math.abs(deviation);
  if (absDeviation <= AZIMUTH_THRESHOLDS.BEST) {
    return 'best';
  } else if (absDeviation <= AZIMUTH_THRESHOLDS.GOOD) {
    return 'good';
  }
  return 'bad';
}

/**
 * Calculate deviation between two angles
 * Returns the smallest angle between them (-180 to 180)
 */
export function calculateAngleDeviation(current: number, target: number): number {
  let deviation = current - target;
  
  // Normalize to -180 to 180 range for circular angles
  while (deviation > 180) deviation -= 360;
  while (deviation < -180) deviation += 360;
  
  return deviation;
}

/**
 * Calculate alignment percentage (0-100)
 * 100% = perfectly aligned, 0% = far off
 */
export function calculateAlignmentPercentage(
  deviation: number,
  maxDeviation: number = 45
): number {
  const absDeviation = Math.abs(deviation);
  const percentage = Math.max(0, 100 - (absDeviation / maxDeviation) * 100);
  return Math.round(percentage);
}

/**
 * Get full alignment result
 */
export function getAlignmentResult(
  currentTilt: number,
  targetTilt: number,
  currentAzimuth: number,
  targetAzimuth: number
): AlignmentResult {
  const tiltDeviation = currentTilt - targetTilt;
  const azimuthDeviation = calculateAngleDeviation(currentAzimuth, targetAzimuth);

  return {
    tiltDeviation,
    azimuthDeviation,
    tiltStatus: getTiltStatus(tiltDeviation),
    azimuthStatus: getAzimuthStatus(azimuthDeviation),
    tiltPercentage: calculateAlignmentPercentage(tiltDeviation),
    azimuthPercentage: calculateAlignmentPercentage(azimuthDeviation, 90),
  };
}

/**
 * Generic alignment status getter (alias for getTiltStatus)
 * Used by individual tilt/compass screens
 */
export function getAlignmentStatus(deviation: number): AlignmentStatus {
  return getTiltStatus(deviation);
}

/**
 * Generic alignment percentage getter (alias for calculateAlignmentPercentage)
 */
export function getAlignmentPercentage(deviation: number): number {
  return calculateAlignmentPercentage(deviation);
}

/**
 * Get color for alignment status
 */
export function getStatusColor(status: AlignmentStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Interpolate color based on deviation
 * Returns a color between red -> yellow -> green based on proximity to target
 */
export function getInterpolatedColor(
  deviation: number,
  bestThreshold: number,
  goodThreshold: number
): string {
  const absDeviation = Math.abs(deviation);

  if (absDeviation <= bestThreshold) {
    return STATUS_COLORS.best;
  } else if (absDeviation <= goodThreshold) {
    // Interpolate between green and yellow
    const t = (absDeviation - bestThreshold) / (goodThreshold - bestThreshold);
    return interpolateColor(STATUS_COLORS.best, STATUS_COLORS.good, t);
  } else {
    // Interpolate between yellow and red
    const maxDeviation = goodThreshold * 3;
    const t = Math.min(1, (absDeviation - goodThreshold) / (maxDeviation - goodThreshold));
    return interpolateColor(STATUS_COLORS.good, STATUS_COLORS.bad, t);
  }
}

/**
 * Simple hex color interpolation
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
