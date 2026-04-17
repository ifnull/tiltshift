import { useState, useEffect, useRef } from 'react';
import type { AlignmentMode, LocationData, OptimalAngles, CalculationAlgorithm, TouSettings } from '../types';
import { calculateOptimalAngles, getHemisphere, getOptimalAzimuth, getOptimalAzimuthForTou } from '../utils/solarCalculations';
import { getOptimalTiltFromPVWatts, getWinterPriorityTiltFromPVWatts } from '../services/pvwattsApi';

interface OptimalAngleState {
  optimalAngles: OptimalAngles | null;
  isCalculating: boolean;
  isLive: boolean; // Indicates if using live API data
}

/**
 * Hook to calculate optimal angles based on location, mode, algorithm, and optional TOU rates.
 * When TOU is enabled, azimuth is chosen to maximize value (production × rate) over the day.
 */
export function useOptimalAngle(
  location: LocationData | null,
  mode: AlignmentMode,
  algorithm: CalculationAlgorithm = 'simple',
  touSettings?: TouSettings | null
): OptimalAngleState {
  const [state, setState] = useState<OptimalAngleState>({
    optimalAngles: null,
    isCalculating: false,
    isLive: false,
  });
  
  // Track the current request to avoid race conditions
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!location) {
      setState({ optimalAngles: null, isCalculating: false, isLive: false });
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, isCalculating: true }));

    // Handle PVWatts Live and Winter Priority async calculations
    if ((algorithm === 'pvwatts-live' || algorithm === 'pvwatts-winter') && mode !== 'daily') {
      const apiCall = algorithm === 'pvwatts-winter'
        ? getWinterPriorityTiltFromPVWatts(location.latitude, location.longitude)
        : getOptimalTiltFromPVWatts(location.latitude, location.longitude);
      
      apiCall
        .then((result) => {
          if (currentRequestId !== requestIdRef.current) return;
          const azimuth =
            touSettings?.enabled && touSettings.blocks.length > 0
              ? getOptimalAzimuthForTou(location.latitude, result.tilt, touSettings.blocks, new Date())
              : getOptimalAzimuth(location.latitude);
          setState({
            optimalAngles: {
              tilt: result.tilt,
              azimuth,
              hemisphere: getHemisphere(location.latitude),
            },
            isCalculating: false,
            isLive: result.confidence === 'live',
          });
        })
        .catch(() => {
          if (currentRequestId !== requestIdRef.current) return;
          
          // Fallback to local calculation on error
          // For winter priority, fallback to latitude + 15°
          const fallbackAlgo = algorithm === 'pvwatts-winter' ? 'simple' : 'pvwatts';
          const angles = calculateOptimalAngles(location, mode, new Date(), fallbackAlgo, touSettings);
          if (algorithm === 'pvwatts-winter') {
            // Adjust for winter priority fallback
            angles.tilt = Math.min(90, Math.abs(location.latitude) + 15);
          }
          setState({ optimalAngles: angles, isCalculating: false, isLive: false });
        });
      
      return;
    }

    const angles = calculateOptimalAngles(location, mode, new Date(), algorithm, touSettings);
    setState({ optimalAngles: angles, isCalculating: false, isLive: false });
  }, [location, mode, algorithm, touSettings]);

  return state;
}
