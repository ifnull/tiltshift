import { useState, useEffect } from 'react';
import type { AlignmentMode, LocationData, OptimalAngles } from '../types';
import { calculateOptimalAngles } from '../utils/solarCalculations';

interface OptimalAngleState {
  optimalAngles: OptimalAngles | null;
  isCalculating: boolean;
}

/**
 * Hook to calculate optimal angles based on location and mode
 * Recalculates when location, mode, or time changes (for daily mode)
 */
export function useOptimalAngle(
  location: LocationData | null,
  mode: AlignmentMode
): OptimalAngleState {
  const [state, setState] = useState<OptimalAngleState>({
    optimalAngles: null,
    isCalculating: false,
  });

  useEffect(() => {
    if (!location) {
      setState({ optimalAngles: null, isCalculating: false });
      return;
    }

    setState((prev) => ({ ...prev, isCalculating: true }));

    // Calculate optimal angles
    const angles = calculateOptimalAngles(location, mode, new Date());
    setState({ optimalAngles: angles, isCalculating: false });

    // For daily mode, recalculate every minute
    if (mode === 'daily') {
      const interval = setInterval(() => {
        const updatedAngles = calculateOptimalAngles(location, mode, new Date());
        setState({ optimalAngles: updatedAngles, isCalculating: false });
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [location, mode]);

  return state;
}
