import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { LocationData } from '../types';
import { 
  getOptimalTiltFromPVWatts, 
  getCachedTilt,
  getWinterPriorityTiltFromPVWatts,
  getCachedWinterTilt,
} from '../services/pvwattsApi';

interface PVWattsLiveState {
  tilt: number | null;
  isLoading: boolean;
  isLive: boolean; // true if we got a live result (not cached/fallback)
}

/**
 * Hook to manage PVWatts Live API fetching
 * - Fetches on mount if enabled
 * - Fetches when app comes to foreground if enabled
 * - Fetches when location changes significantly
 * @param winterPriority - If true, uses winter priority optimization (worst-month)
 */
export function usePVWattsLive(
  location: LocationData | null,
  enabled: boolean,
  winterPriority: boolean = false
): PVWattsLiveState {
  const [state, setState] = useState<PVWattsLiveState>({
    tilt: null,
    isLoading: false,
    isLive: false,
  });
  
  // Track previous location to detect significant changes
  const prevLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  const appState = useRef(AppState.currentState);

  const fetchPVWatts = useCallback(async (lat: number, lon: number) => {
    // First check cache (use appropriate cache based on mode)
    const cachedTilt = winterPriority 
      ? getCachedWinterTilt(lat, lon) 
      : getCachedTilt(lat, lon);
    if (cachedTilt !== null) {
      setState({ tilt: cachedTilt, isLoading: false, isLive: false });
      return;
    }

    // No cache, fetch from API
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = winterPriority
        ? await getWinterPriorityTiltFromPVWatts(lat, lon)
        : await getOptimalTiltFromPVWatts(lat, lon);
      setState({
        tilt: result.tilt,
        isLoading: false,
        isLive: result.confidence === 'live',
      });
    } catch (error) {
      console.warn('PVWatts Live fetch failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [winterPriority]);

  // Check if location changed significantly (different cache key)
  const hasLocationChanged = useCallback((lat: number, lon: number): boolean => {
    if (!prevLocationRef.current) return true;
    
    // Compare rounded values (same as cache key precision)
    const prevRounded = {
      lat: prevLocationRef.current.lat.toFixed(2),
      lon: prevLocationRef.current.lon.toFixed(2),
    };
    const newRounded = {
      lat: lat.toFixed(2),
      lon: lon.toFixed(2),
    };
    
    return prevRounded.lat !== newRounded.lat || prevRounded.lon !== newRounded.lon;
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        enabled &&
        location
      ) {
        fetchPVWatts(location.latitude, location.longitude);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [enabled, location, fetchPVWatts]);

  // Track previous winterPriority to detect changes
  const prevWinterPriorityRef = useRef<boolean>(winterPriority);

  // Fetch on mount, when enabled changes, when location changes significantly, or when winterPriority changes
  useEffect(() => {
    if (!enabled || !location) {
      setState({ tilt: null, isLoading: false, isLive: false });
      prevLocationRef.current = null;
      return;
    }

    const locationChanged = hasLocationChanged(location.latitude, location.longitude);
    const modeChanged = prevWinterPriorityRef.current !== winterPriority;
    prevWinterPriorityRef.current = winterPriority;
    
    if (locationChanged || modeChanged) {
      prevLocationRef.current = { lat: location.latitude, lon: location.longitude };
      fetchPVWatts(location.latitude, location.longitude);
    }
  }, [enabled, location, fetchPVWatts, hasLocationChanged, winterPriority]);

  return state;
}
