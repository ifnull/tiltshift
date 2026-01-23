import type { AlignmentMode, Season, OptimalAngles, LocationData } from '../types';
import { SEASONAL_ADJUSTMENT, EARTH_AXIAL_TILT } from './constants';

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
 * Calculate optimal tilt angle for year-round production
 * Simple rule: tilt ≈ latitude
 */
export function getYearRoundTilt(latitude: number): number {
  return Math.abs(latitude);
}

/**
 * Calculate optimal tilt angle for seasonal optimization
 */
export function getSeasonalTilt(latitude: number, season: Season): number {
  const baseTilt = Math.abs(latitude);

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
 * Calculate all optimal angles based on mode and location
 */
export function calculateOptimalAngles(
  location: LocationData,
  mode: AlignmentMode,
  date: Date = new Date()
): OptimalAngles {
  const { latitude } = location;
  const hemisphere = getHemisphere(latitude);

  let tilt: number;

  switch (mode) {
    case 'seasonal':
      const season = getCurrentSeason(date, hemisphere);
      tilt = getSeasonalTilt(latitude, season);
      break;
    case 'daily':
      tilt = getDailyTilt(latitude, date);
      break;
    case 'year-round':
    default:
      tilt = getYearRoundTilt(latitude);
      break;
  }

  return {
    tilt,
    azimuth: getOptimalAzimuth(latitude),
    hemisphere,
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
