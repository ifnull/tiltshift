/**
 * NREL PVWatts API Service
 * https://developer.nrel.gov/docs/solar/pvwatts/
 */

// ⚠️ API Key - Replace with your key from https://developer.nrel.gov/signup/
const NREL_API_KEY = 'nNiMVZC2nOA90cp7ZrNyEoR3SkLOjuT9p0ExAaV0'; // TODO: Replace with real key

const PVWATTS_BASE_URL = 'https://developer.nrel.gov/api/pvwatts/v8.json';

interface PVWattsParams {
  latitude: number;
  longitude: number;
  tilt?: number; // If not provided, API uses latitude as default
  azimuth?: number; // 180 for south-facing (northern hemisphere)
}

interface PVWattsResponse {
  inputs: {
    lat: number;
    lon: number;
    tilt: number;
    azimuth: number;
  };
  outputs: {
    ac_annual: number; // Annual AC energy (kWh)
    solrad_annual: number; // Annual solar radiation (kWh/m2/day)
    capacity_factor: number;
    ac_monthly: number[];
    solrad_monthly: number[];
    poa_monthly: number[]; // Plane of array irradiance
  };
  errors?: string[];
}

interface OptimalTiltResult {
  tilt: number;
  annualProduction: number;
  confidence: 'live' | 'cached' | 'fallback';
}

interface WinterPriorityResult {
  tilt: number;
  decemberProduction: number;
  juneProduction: number;
  confidence: 'live' | 'cached' | 'fallback';
}

// Cache for API results (keyed by lat,lon rounded to 2 decimal places)
const tiltCache = new Map<string, { tilt: number; timestamp: number }>();
const winterTiltCache = new Map<string, { tilt: number; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from coordinates
 */
function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

/**
 * Call PVWatts API with specific parameters
 * Note: Coordinates are rounded to 2 decimal places (~1.1km precision) for privacy
 */
async function callPVWatts(params: PVWattsParams): Promise<PVWattsResponse> {
  // Round coordinates to 2 decimal places for privacy (~1.1km / 0.7mi precision)
  const roundedLat = Number(params.latitude.toFixed(2));
  const roundedLon = Number(params.longitude.toFixed(2));
  
  const url = new URL(PVWATTS_BASE_URL);
  url.searchParams.set('api_key', NREL_API_KEY);
  url.searchParams.set('lat', roundedLat.toString());
  url.searchParams.set('lon', roundedLon.toString());
  url.searchParams.set('system_capacity', '4'); // 4 kW system (standard residential)
  url.searchParams.set('azimuth', (params.azimuth ?? 180).toString());
  url.searchParams.set('tilt', (params.tilt ?? params.latitude).toString());
  url.searchParams.set('array_type', '1'); // Fixed roof mount
  url.searchParams.set('module_type', '0'); // Standard module
  url.searchParams.set('losses', '14'); // 14% system losses (default)

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`PVWatts API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Find optimal tilt by testing multiple angles and finding the one with highest production
 * This is a simplified approach - tests a few angles around latitude
 */
export async function getOptimalTiltFromPVWatts(
  latitude: number,
  longitude: number
): Promise<OptimalTiltResult> {
  const cacheKey = getCacheKey(latitude, longitude);
  
  // Check cache first
  const cached = tiltCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      tilt: cached.tilt,
      annualProduction: 0,
      confidence: 'cached',
    };
  }

  try {
    // Test angles around latitude to find optimal
    // PVWatts typically shows optimal is close to latitude, so we test ±10°
    const baseAngle = Math.abs(latitude);
    const testAngles = [
      baseAngle - 10,
      baseAngle - 5,
      baseAngle,
      baseAngle + 5,
      baseAngle + 10,
    ].filter(a => a >= 0 && a <= 90);

    let bestTilt = baseAngle;
    let bestProduction = 0;

    // Make parallel requests for efficiency
    const results = await Promise.all(
      testAngles.map(async (tilt) => {
        try {
          const result = await callPVWatts({
            latitude,
            longitude,
            tilt,
            azimuth: latitude >= 0 ? 180 : 0, // South for northern hemisphere
          });
          return { tilt, production: result.outputs.ac_annual };
        } catch {
          return { tilt, production: 0 };
        }
      })
    );

    // Find the tilt with highest production
    for (const result of results) {
      if (result.production > bestProduction) {
        bestProduction = result.production;
        bestTilt = result.tilt;
      }
    }

    // Cache the result
    tiltCache.set(cacheKey, { tilt: bestTilt, timestamp: Date.now() });

    return {
      tilt: bestTilt,
      annualProduction: bestProduction,
      confidence: 'live',
    };
  } catch (error) {
    console.warn('PVWatts API error, using fallback:', error);
    
    // Fallback to our approximation
    const fallbackTilt = Math.abs(latitude) * 0.87;
    return {
      tilt: fallbackTilt,
      annualProduction: 0,
      confidence: 'fallback',
    };
  }
}

/**
 * Find optimal tilt for winter priority (worst-month optimization)
 * Goal: Maximize December production without letting June drop below December
 * This is ideal for 24/7 systems like security cameras that need reliable year-round power
 */
export async function getWinterPriorityTiltFromPVWatts(
  latitude: number,
  longitude: number
): Promise<WinterPriorityResult> {
  const cacheKey = getCacheKey(latitude, longitude);
  
  // Check cache first
  const cached = winterTiltCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      tilt: cached.tilt,
      decemberProduction: 0,
      juneProduction: 0,
      confidence: 'cached',
    };
  }

  try {
    // Test angles from latitude to latitude + 25° (steeper angles for winter)
    // We want the steepest angle where June >= December
    const baseAngle = Math.abs(latitude);
    const testAngles = [];
    
    // Test from base angle to base + 25° in 5° increments
    for (let offset = 0; offset <= 25; offset += 5) {
      const angle = baseAngle + offset;
      if (angle >= 0 && angle <= 90) {
        testAngles.push(angle);
      }
    }

    // Make parallel requests for efficiency
    const results = await Promise.all(
      testAngles.map(async (tilt) => {
        try {
          const result = await callPVWatts({
            latitude,
            longitude,
            tilt,
            azimuth: latitude >= 0 ? 180 : 0,
          });
          // ac_monthly is 0-indexed: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
          const juneProduction = result.outputs.ac_monthly[5];  // June (index 5)
          const decProduction = result.outputs.ac_monthly[11];  // December (index 11)
          return { tilt, juneProduction, decProduction };
        } catch {
          return { tilt, juneProduction: 0, decProduction: 0 };
        }
      })
    );

    // Find the steepest angle where June production >= December production
    // Sort by tilt descending (steepest first)
    results.sort((a, b) => b.tilt - a.tilt);
    
    let bestResult = results[results.length - 1]; // Default to lowest angle
    
    for (const result of results) {
      if (result.juneProduction >= result.decProduction && result.decProduction > 0) {
        // This is a valid angle - June doesn't drop below December
        // Since we're iterating steepest first, this is our answer
        bestResult = result;
        break;
      }
    }

    // Cache the result
    winterTiltCache.set(cacheKey, { tilt: bestResult.tilt, timestamp: Date.now() });

    return {
      tilt: bestResult.tilt,
      decemberProduction: bestResult.decProduction,
      juneProduction: bestResult.juneProduction,
      confidence: 'live',
    };
  } catch (error) {
    console.warn('PVWatts Winter Priority API error, using fallback:', error);
    
    // Fallback: latitude + 15° is a common winter optimization
    const fallbackTilt = Math.min(90, Math.abs(latitude) + 15);
    return {
      tilt: fallbackTilt,
      decemberProduction: 0,
      juneProduction: 0,
      confidence: 'fallback',
    };
  }
}

/**
 * Simple single-call version that uses latitude as tilt (for quick estimates)
 */
export async function getPVWattsEstimate(
  latitude: number,
  longitude: number
): Promise<PVWattsResponse | null> {
  try {
    return await callPVWatts({ latitude, longitude });
  } catch (error) {
    console.warn('PVWatts API error:', error);
    return null;
  }
}

/**
 * Check if we have a valid API key configured
 */
export function isPVWattsConfigured(): boolean {
  return NREL_API_KEY !== 'DEMO_KEY' && NREL_API_KEY.length > 0;
}

/**
 * Clear the tilt cache (useful for testing)
 */
export function clearPVWattsCache(): void {
  tiltCache.clear();
  winterTiltCache.clear();
}

/**
 * Get cached tilt value for a location (if available and not expired)
 * Returns null if no valid cache exists
 */
export function getCachedTilt(latitude: number, longitude: number): number | null {
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = tiltCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.tilt;
  }
  
  return null;
}

/**
 * Get cached winter priority tilt value for a location (if available and not expired)
 * Returns null if no valid cache exists
 */
export function getCachedWinterTilt(latitude: number, longitude: number): number | null {
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = winterTiltCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.tilt;
  }
  
  return null;
}
