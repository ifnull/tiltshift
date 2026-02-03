import { useState, useEffect, useRef } from 'react';
import type { AlignmentMode, LocationData, OptimalAngles, CalculationAlgorithm } from '../types';
import { calculateOptimalAngles, getHemisphere, getOptimalAzimuth } from '../utils/solarCalculations';
import { getOptimalTiltFromPVWatts, getWinterPriorityTiltFromPVWatts } from '../services/pvwattsApi';

interface OptimalAngleState {
  optimalAngles: OptimalAngles | null;
  isCalculating: boolean;
  isLive: boolean; // Indicates if using live API data
}

/**
 * Hook to calculate optimal angles based on location, mode, and algorithm
 * Recalculates when location, mode, algorithm, or time changes (for daily mode)
 * Supports async PVWatts Live API calls
 */
export function useOptimalAngle(
  location: LocationData | null,
  mode: AlignmentMode,
  algorithm: CalculationAlgorithm = 'simple'
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
          // Only update if this is still the current request
          if (currentRequestId !== requestIdRef.current) return;
          
          setState({
            optimalAngles: {
              tilt: result.tilt,
              azimuth: getOptimalAzimuth(location.latitude),
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
          const angles = calculateOptimalAngles(location, mode, new Date(), fallbackAlgo);
          if (algorithm === 'pvwatts-winter') {
            // Adjust for winter priority fallback
            angles.tilt = Math.min(90, Math.abs(location.latitude) + 15);
          }
          setState({ optimalAngles: angles, isCalculating: false, isLive: false });
        });
      
      return;
    }

    // Synchronous calculation for other algorithms
    const angles = calculateOptimalAngles(location, mode, new Date(), algorithm);
    setState({ optimalAngles: angles, isCalculating: false, isLive: false });

    // For daily mode, recalculate every minute
    if (mode === 'daily') {
      const interval = setInterval(() => {
        const updatedAngles = calculateOptimalAngles(location, mode, new Date(), algorithm);
        setState({ optimalAngles: updatedAngles, isCalculating: false, isLive: false });
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [location, mode, algorithm]);

  return state;
}
