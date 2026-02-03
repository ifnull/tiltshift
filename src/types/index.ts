// Alignment modes
export type AlignmentMode = 'year-round' | 'seasonal' | 'daily';

// Calculation algorithms for optimal tilt
export type CalculationAlgorithm = 'simple' | 'optimized' | 'landau' | 'jacobson' | 'pvwatts' | 'pvwatts-live' | 'pvwatts-winter';

// Algorithm metadata for UI
export interface AlgorithmInfo {
  id: CalculationAlgorithm;
  name: string;
  shortName: string;
  description: string;
  formula: string;
}

// Season for seasonal mode
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Alignment quality status
export type AlignmentStatus = 'best' | 'good' | 'bad';

// Location data from GPS
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
}

// Calculated optimal angles
export interface OptimalAngles {
  tilt: number; // degrees from horizontal
  azimuth: number; // degrees from north (0-360)
  hemisphere: 'northern' | 'southern';
}

// Current device orientation
export interface DeviceOrientation {
  tilt: number; // current tilt angle
  heading: number; // compass heading
}

// Alignment calculation result
export interface AlignmentResult {
  tiltDeviation: number;
  azimuthDeviation: number;
  tiltStatus: AlignmentStatus;
  azimuthStatus: AlignmentStatus;
  tiltPercentage: number; // 0-100
  azimuthPercentage: number; // 0-100
}

// Accelerometer data
export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

// Color theme for status indicators
export interface StatusColors {
  best: string;
  good: string;
  bad: string;
}
