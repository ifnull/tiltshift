import type { AlignmentMode, Season, OptimalAngles, LocationData, CalculationAlgorithm, AlgorithmInfo } from '../types';
import { SEASONAL_ADJUSTMENT, EARTH_AXIAL_TILT } from './constants';

/**
 * Algorithm metadata for UI display
 */
export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'simple',
    name: 'Simple Latitude',
    shortName: 'Simple',
    description: 'Classic rule: tilt equals your latitude. Maximizes direct sunlight.',
    formula: 'tilt = latitude',
  },
  {
    id: 'optimized',
    name: 'Energy Optimized',
    shortName: 'Optimized',
    description: 'Accounts for diffuse radiation. Better total annual energy.',
    formula: 'tilt = latitude × 0.9',
  },
  {
    id: 'landau',
    name: 'Landau Formula',
    shortName: 'Landau',
    description: 'Research-backed empirical formula for maximum energy yield.',
    formula: 'tilt = latitude × 0.76 + 3.1°',
  },
  {
    id: 'jacobson',
    name: 'Jacobson Polynomial',
    shortName: 'Jacobson',
    description: 'Academic polynomial curve fit from simulation data.',
    formula: 'tilt = polynomial(latitude)',
  },
  {
    id: 'pvwatts',
    name: 'PVWatts Estimate',
    shortName: 'PVWatts',
    description: 'Approximates NREL PVWatts model used by professionals.',
    formula: 'tilt ≈ latitude × 0.87',
  },
  {
    id: 'pvwatts-live',
    name: 'PVWatts Live',
    shortName: '⚡ Live',
    description: 'Real-time calculation from NREL PVWatts API. Requires internet.',
    formula: 'NREL API (industry standard)',
  },
  {
    id: 'pvwatts-winter',
    name: 'Winter Priority',
    shortName: '❄️ Winter',
    description: 'Maximizes winter output without sacrificing summer. Ideal for 24/7 systems.',
    formula: 'NREL API (worst-month optimized)',
  },
];

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Get the current day of year (1-365)
 */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get the current season based on date and hemisphere
 */
export function getCurrentSeason(
  date: Date = new Date(),
  hemisphere: 'northern' | 'southern' = 'northern'
): Season {
  const month = date.getMonth(); // 0-11

  // Northern hemisphere seasons
  let season: Season;
  if (month >= 2 && month <= 4) {
    season = 'spring';
  } else if (month >= 5 && month <= 7) {
    season = 'summer';
  } else if (month >= 8 && month <= 10) {
    season = 'fall';
  } else {
    season = 'winter';
  }

  // Flip for southern hemisphere
  if (hemisphere === 'southern') {
    const flipMap: Record<Season, Season> = {
      spring: 'fall',
      summer: 'winter',
      fall: 'spring',
      winter: 'summer',
    };
    season = flipMap[season];
  }

  return season;
}

/**
 * Calculate solar declination angle for a given day of year
 * Declination varies between +23.45° (summer solstice) and -23.45° (winter solstice)
 */
export function getSolarDeclination(dayOfYear: number): number {
  // Using simplified equation: δ = 23.45° × sin(360/365 × (N - 81))
  const angleRadians = degreesToRadians((360 / 365) * (dayOfYear - 81));
  return EARTH_AXIAL_TILT * Math.sin(angleRadians);
}

/**
 * Calculate the hour angle (degrees from solar noon)
 * @param hour - Hour in 24h format (0-23), ideally solar time
 */
export function getHourAngle(hour: number): number {
  // Hour angle = 15° per hour from solar noon (12:00)
  return 15 * (hour - 12);
}

/**
 * Calculate solar altitude angle (sun's angle above horizon)
 * @param latitude - Location latitude in degrees
 * @param declination - Solar declination in degrees
 * @param hourAngle - Hour angle in degrees
 */
export function getSolarAltitude(
  latitude: number,
  declination: number,
  hourAngle: number
): number {
  const latRad = degreesToRadians(latitude);
  const decRad = degreesToRadians(declination);
  const hourRad = degreesToRadians(hourAngle);

  const sinAltitude =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad);

  return radiansToDegrees(Math.asin(sinAltitude));
}

/**
 * Calculate optimal tilt using Simple Latitude rule
 * tilt = latitude
 */
export function getSimpleTilt(latitude: number): number {
  return Math.abs(latitude);
}

/**
 * Calculate optimal tilt using Energy Optimized formula
 * tilt = latitude × 0.9
 * Better accounts for diffuse radiation
 */
export function getOptimizedTilt(latitude: number): number {
  return Math.abs(latitude) * 0.9;
}

/**
 * Calculate optimal tilt using Landau formula
 * tilt = latitude × 0.76 + 3.1
 * Empirically derived for maximum energy yield
 */
export function getLandauTilt(latitude: number): number {
  return Math.abs(latitude) * 0.76 + 3.1;
}

/**
 * Calculate optimal tilt using Jacobson polynomial
 * Polynomial curve fit from simulation data
 * tilt = 1.3793 + lat × (1.2011 + lat × (−0.014404 + lat × 0.000080509))
 */
export function getJacobsonTilt(latitude: number): number {
  const lat = Math.abs(latitude);
  return 1.3793 + lat * (1.2011 + lat * (-0.014404 + lat * 0.000080509));
}

/**
 * Calculate optimal tilt approximating PVWatts/NREL model
 * tilt ≈ latitude × 0.87
 * Simplified approximation of the full irradiance model
 */
export function getPVWattsTilt(latitude: number): number {
  return Math.abs(latitude) * 0.87;
}

/**
 * Calculate optimal tilt angle based on selected algorithm
 */
export function getTiltByAlgorithm(latitude: number, algorithm: CalculationAlgorithm): number {
  switch (algorithm) {
    case 'optimized':
      return getOptimizedTilt(latitude);
    case 'landau':
      return getLandauTilt(latitude);
    case 'jacobson':
      return getJacobsonTilt(latitude);
    case 'pvwatts':
      return getPVWattsTilt(latitude);
    case 'simple':
    default:
      return getSimpleTilt(latitude);
  }
}

/**
 * Calculate optimal tilt angle for year-round production
 * Uses the specified algorithm (defaults to simple)
 */
export function getYearRoundTilt(latitude: number, algorithm: CalculationAlgorithm = 'simple'): number {
  return getTiltByAlgorithm(latitude, algorithm);
}

/**
 * Calculate optimal tilt angle for seasonal optimization
 * Uses the base tilt from the selected algorithm, then applies seasonal adjustment
 */
export function getSeasonalTilt(latitude: number, season: Season, algorithm: CalculationAlgorithm = 'simple'): number {
  const baseTilt = getTiltByAlgorithm(latitude, algorithm);

  switch (season) {
    case 'summer':
      return Math.max(0, baseTilt - SEASONAL_ADJUSTMENT);
    case 'winter':
      return Math.min(90, baseTilt + SEASONAL_ADJUSTMENT);
    case 'spring':
    case 'fall':
    default:
      return baseTilt;
  }
}

/**
 * Calculate optimal tilt angle for current sun position (daily tracking)
 */
export function getDailyTilt(
  latitude: number,
  date: Date = new Date()
): number {
  const dayOfYear = getDayOfYear(date);
  const hour = date.getHours() + date.getMinutes() / 60;

  const declination = getSolarDeclination(dayOfYear);
  const hourAngle = getHourAngle(hour);
  const solarAltitude = getSolarAltitude(latitude, declination, hourAngle);

  // Optimal tilt = 90° - solar altitude (perpendicular to sun rays)
  const optimalTilt = 90 - solarAltitude;

  // Clamp between 0 and 90 degrees
  return Math.max(0, Math.min(90, optimalTilt));
}

/**
 * Get optimal azimuth (direction phone TOP should point when on panel)
 * 
 * When phone is laid flat on a tilted panel:
 * - Phone screen faces up (same direction as panel surface)
 * - Phone TOP points up the slope (toward back/top edge of panel)
 * 
 * For south-facing panel (northern hemisphere):
 * - Panel surface faces south, but top edge is on north side
 * - Phone top points NORTH (0°)
 * 
 * For north-facing panel (southern hemisphere):
 * - Panel surface faces north, but top edge is on south side  
 * - Phone top points SOUTH (180°)
 */
export function getOptimalAzimuth(latitude: number): number {
  return latitude >= 0 ? 0 : 180;
}

/**
 * Get hemisphere based on latitude
 */
export function getHemisphere(latitude: number): 'northern' | 'southern' {
  return latitude >= 0 ? 'northern' : 'southern';
}

/**
 * Calculate all optimal angles based on mode, location, and algorithm
 */
export function calculateOptimalAngles(
  location: LocationData,
  mode: AlignmentMode,
  date: Date = new Date(),
  algorithm: CalculationAlgorithm = 'simple'
): OptimalAngles {
  const { latitude } = location;
  const hemisphere = getHemisphere(latitude);

  let tilt: number;

  switch (mode) {
    case 'seasonal':
      const season = getCurrentSeason(date, hemisphere);
      tilt = getSeasonalTilt(latitude, season, algorithm);
      break;
    case 'daily':
      // Daily mode tracks the sun position, so algorithm doesn't apply
      tilt = getDailyTilt(latitude, date);
      break;
    case 'year-round':
    default:
      tilt = getYearRoundTilt(latitude, algorithm);
      break;
  }

  return {
    tilt,
    azimuth: getOptimalAzimuth(latitude),
    hemisphere,
  };
}

/**
 * Calculate tilt for all algorithms at once (for comparison display)
 * Supports different modes: year-round, seasonal, and daily
 * For daily mode, returns null since tilt is sun-position based, not algorithm-based
 */
export function calculateAllAlgorithms(
  latitude: number,
  mode: AlignmentMode = 'year-round',
  date: Date = new Date()
): Record<CalculationAlgorithm, number> | null {
  const hemisphere = getHemisphere(latitude);
  
  // Daily mode tracks sun position - algorithm doesn't affect the result
  if (mode === 'daily') {
    const dailyTilt = getDailyTilt(latitude, date);
    return {
      simple: dailyTilt,
      optimized: dailyTilt,
      landau: dailyTilt,
      jacobson: dailyTilt,
      pvwatts: dailyTilt,
    };
  }
  
  // Seasonal mode applies seasonal adjustment to each algorithm's base tilt
  if (mode === 'seasonal') {
    const season = getCurrentSeason(date, hemisphere);
    return {
      simple: getSeasonalTilt(latitude, season, 'simple'),
      optimized: getSeasonalTilt(latitude, season, 'optimized'),
      landau: getSeasonalTilt(latitude, season, 'landau'),
      jacobson: getSeasonalTilt(latitude, season, 'jacobson'),
      pvwatts: getSeasonalTilt(latitude, season, 'pvwatts'),
    };
  }
  
  // Year-round mode
  return {
    simple: getSimpleTilt(latitude),
    optimized: getOptimizedTilt(latitude),
    landau: getLandauTilt(latitude),
    jacobson: getJacobsonTilt(latitude),
    pvwatts: getPVWattsTilt(latitude),
  };
}

/**
 * Format degrees with degree symbol
 */
export function formatDegrees(degrees: number, decimals: number = 1): string {
  return `${degrees.toFixed(decimals)}°`;
}

/**
 * Get cardinal direction from heading
 */
export function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return directions[index];
}
