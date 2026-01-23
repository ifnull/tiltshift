import type { StatusColors } from '../types';

// Alignment thresholds (in degrees)
export const TILT_THRESHOLDS = {
  BEST: 2,
  GOOD: 5,
} as const;

export const AZIMUTH_THRESHOLDS = {
  BEST: 5,
  GOOD: 15,
} as const;

// Haptic feedback thresholds (in degrees)
export const HAPTIC_THRESHOLDS = {
  VERY_CLOSE: 2,
  CLOSE: 5,
  APPROACHING: 10,
} as const;

// Haptic intervals (in ms)
export const HAPTIC_INTERVALS = {
  LOCKED: 0, // Single confirmation
  VERY_CLOSE: 100,
  CLOSE: 250,
  APPROACHING: 500,
} as const;

// Status colors
export const STATUS_COLORS: StatusColors = {
  best: '#22c55e', // Green
  good: '#eab308', // Yellow/Amber
  bad: '#ef4444', // Red
} as const;

// Background gradient colors
export const BACKGROUND_GRADIENT = {
  dark: ['#0f0f23', '#1a1a2e', '#16213e'],
  light: ['#f0f9ff', '#e0f2fe', '#bae6fd'],
} as const;

// Seasonal adjustments (in degrees)
export const SEASONAL_ADJUSTMENT = 15;

// Earth's axial tilt (in degrees)
export const EARTH_AXIAL_TILT = 23.45;

// Sensor update intervals (in ms)
export const SENSOR_UPDATE_INTERVAL = 100;

// Animation spring config
export const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
} as const;
