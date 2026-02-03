import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationData } from '../types';

const LOCATION_CACHE_KEY = '@tiltsync_location';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface LocationState {
  location: LocationData | null;
  isLoading: boolean; // True only on first load with no cache
  isRefreshing: boolean; // True when updating in background
  isCached: boolean; // True if showing cached data
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

/**
 * Load cached location from AsyncStorage
 */
async function loadCachedLocation(): Promise<LocationData | null> {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached) as LocationData;
      // Check if cache is still valid (within max age)
      const age = Date.now() - data.timestamp;
      if (age < CACHE_MAX_AGE_MS) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save location to cache
 */
async function cacheLocation(location: LocationData): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Hook to get device location (latitude, longitude, altitude)
 * Uses cached location for immediate display, refreshes in background
 */
export function useLocation(): LocationState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    isRefreshing: false,
    isCached: false,
    error: null,
    permissionStatus: null,
  });

  const fetchLocation = useCallback(async (isManualRefresh = false) => {
    // If we have cached location, mark as refreshing instead of loading
    setState((prev) => ({
      ...prev,
      isLoading: prev.location === null,
      isRefreshing: prev.location !== null || isManualRefresh,
      error: null,
    }));

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));

      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: 'Location permission denied. Please enable location access in settings.',
        }));
        return;
      }

      // Get current position with low accuracy (coarse location)
      // Low accuracy is sufficient for latitude-based solar calculations
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy ?? 0,
        timestamp: Date.now(),
      };

      // Cache the new location
      await cacheLocation(locationData);

      setState((prev) => ({
        ...prev,
        location: locationData,
        isLoading: false,
        isRefreshing: false,
        isCached: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: prev.location === null, // Only show loading error if no cached data
        isRefreshing: false,
        error: prev.location === null 
          ? (err instanceof Error ? err.message : 'Failed to get location')
          : null, // Don't show error if we have cached data
      }));
    }
  }, []);

  // Initial load: try cache first, then fetch fresh
  useEffect(() => {
    const initialize = async () => {
      // Try to load cached location first
      const cached = await loadCachedLocation();
      
      if (cached) {
        setState((prev) => ({
          ...prev,
          location: cached,
          isLoading: false,
          isCached: true,
        }));
      }

      // Fetch fresh location in background
      fetchLocation();
    };

    initialize();
  }, [fetchLocation]);

  return { ...state, refresh: () => fetchLocation(true) };
}

/**
 * Get a human-readable location name (city, region)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const { city, region, country } = results[0];
      const parts = [city, region].filter(Boolean);
      if (parts.length === 0 && country) {
        return country;
      }
      return parts.join(', ');
    }
    return null;
  } catch {
    return null;
  }
}
