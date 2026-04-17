import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalculationAlgorithm, TouBlock, TouSettings } from '../types';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  // Base colors
  panel: string;
  panelLight: string;
  bezel: string;
  bezelRing: string;
  face: string;
  border: string;
  
  // Text
  text: string;
  textDim: string;
  markings: string;
  markingsDim: string;
  
  // Instrument colors
  sky: string;
  ground: string;
  horizon: string;
  aircraft: string;
  
  // Status colors
  green: string;
  amber: string;
  red: string;
}

const darkTheme: ThemeColors = {
  panel: '#0d0d0d',
  panelLight: '#1a1a1a',
  bezel: '#1a1a1a',
  bezelRing: '#2d2d2d',
  face: '#0a0a0a',
  border: '#2a2a2a',
  
  text: '#ffffff',
  textDim: '#666666',
  markings: '#ffffff',
  markingsDim: '#888888',
  
  sky: '#0077cc',
  ground: '#553311',
  horizon: '#ffffff',
  aircraft: '#ffaa00',
  
  green: '#00ff66',
  amber: '#ffaa00',
  red: '#ff3333',
};

const lightTheme: ThemeColors = {
  panel: '#f0f0f0',
  panelLight: '#e0e0e0',
  bezel: '#e8e8e8',
  bezelRing: '#d0d0d0',
  face: '#f5f5f5',
  border: '#cccccc',
  
  text: '#000000',
  textDim: '#666666',
  markings: '#000000',
  markingsDim: '#555555',
  
  sky: '#4da6ff',
  ground: '#8b6914',
  horizon: '#000000',
  aircraft: '#cc7700',
  
  green: '#00aa44',
  amber: '#cc8800',
  red: '#cc2222',
};

interface ThemeContextType {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  colors: ThemeColors;
  setPreference: (pref: ThemePreference) => void;
  cyclePreference: () => void;
  algorithm: CalculationAlgorithm;
  setAlgorithm: (algo: CalculationAlgorithm) => void;
  pvwattsLiveEnabled: boolean;
  setPvwattsLiveEnabled: (enabled: boolean) => void;
  // Manual location settings
  useManualLocation: boolean;
  setUseManualLocation: (enabled: boolean) => void;
  manualLatitude: number | null;
  manualLongitude: number | null;
  setManualCoordinates: (lat: number | null, lon: number | null) => void;
  compassInverted: boolean;
  setCompassInverted: (inverted: boolean) => void;
  touSettings: TouSettings;
  setTouSettings: (settings: TouSettings) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = '@tiltsync_theme';
const ALGORITHM_STORAGE_KEY = '@tiltsync_algorithm';
const PVWATTS_LIVE_STORAGE_KEY = '@tiltsync_pvwatts_live';
const USE_MANUAL_LOCATION_KEY = '@tiltsync_use_manual_location';
const MANUAL_COORDINATES_KEY = '@tiltsync_manual_coordinates';
const COMPASS_INVERTED_KEY = '@tiltsync_compass_inverted';
const TOU_SETTINGS_KEY = '@tiltsync_tou_settings';

const DEFAULT_TOU_BLOCKS: TouBlock[] = [
  { startHour: 0, endHour: 12, rateCentsPerKwh: 10 },
  { startHour: 12, endHour: 18, rateCentsPerKwh: 24 },
  { startHour: 18, endHour: 24, rateCentsPerKwh: 10 },
];
const DEFAULT_TOU: TouSettings = { enabled: false, blocks: DEFAULT_TOU_BLOCKS, sellbackCentsPerKwh: null };

const VALID_ALGORITHMS: CalculationAlgorithm[] = ['simple', 'optimized', 'landau', 'jacobson', 'pvwatts', 'pvwatts-live', 'pvwatts-winter'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');
  const [algorithm, setAlgorithmState] = useState<CalculationAlgorithm>('simple');
  const [pvwattsLiveEnabled, setPvwattsLiveEnabledState] = useState<boolean>(false);
  const [useManualLocation, setUseManualLocationState] = useState<boolean>(false);
  const [manualLatitude, setManualLatitude] = useState<number | null>(null);
  const [manualLongitude, setManualLongitude] = useState<number | null>(null);
  const [compassInverted, setCompassInvertedState] = useState<boolean>(false);
  const [touSettings, setTouSettingsState] = useState<TouSettings>(DEFAULT_TOU);

  // Resolve the actual theme based on preference and system setting
  const resolved: ResolvedTheme = 
    preference === 'auto' 
      ? (systemColorScheme === 'light' ? 'light' : 'dark')
      : preference;

  const colors = resolved === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    // Load saved preferences
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'auto' || saved === 'light' || saved === 'dark') {
        setPreferenceState(saved);
      }
    });
    AsyncStorage.getItem(ALGORITHM_STORAGE_KEY).then((saved) => {
      if (saved && VALID_ALGORITHMS.includes(saved as CalculationAlgorithm)) {
        setAlgorithmState(saved as CalculationAlgorithm);
      }
    });
    AsyncStorage.getItem(PVWATTS_LIVE_STORAGE_KEY).then((saved) => {
      if (saved === 'true') {
        setPvwattsLiveEnabledState(true);
      }
    });
    AsyncStorage.getItem(USE_MANUAL_LOCATION_KEY).then((saved) => {
      if (saved === 'true') {
        setUseManualLocationState(true);
      }
    });
    AsyncStorage.getItem(MANUAL_COORDINATES_KEY).then((saved) => {
      if (saved) {
        try {
          const { lat, lon } = JSON.parse(saved);
          if (typeof lat === 'number' && typeof lon === 'number') {
            setManualLatitude(lat);
            setManualLongitude(lon);
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
    AsyncStorage.getItem(COMPASS_INVERTED_KEY).then((saved) => {
      if (saved === 'true') {
        setCompassInvertedState(true);
      }
    });
    AsyncStorage.getItem(TOU_SETTINGS_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as TouSettings;
          if (parsed && typeof parsed.enabled === 'boolean' && Array.isArray(parsed.blocks)) {
            setTouSettingsState({
              enabled: parsed.enabled,
              blocks: parsed.blocks.filter(
                (b): b is TouBlock =>
                  typeof b?.startHour === 'number' &&
                  typeof b?.endHour === 'number' &&
                  typeof b?.rateCentsPerKwh === 'number'
              ),
              sellbackCentsPerKwh:
                typeof parsed.sellbackCentsPerKwh === 'number' ? parsed.sellbackCentsPerKwh : null,
            });
          }
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const setCompassInverted = (inverted: boolean) => {
    setCompassInvertedState(inverted);
    AsyncStorage.setItem(COMPASS_INVERTED_KEY, inverted ? 'true' : 'false');
  };

  const setTouSettings = (settings: TouSettings) => {
    setTouSettingsState(settings);
    AsyncStorage.setItem(TOU_SETTINGS_KEY, JSON.stringify(settings));
  };

  const setPreference = (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newPref);
  };

  const cyclePreference = () => {
    const prefs: ThemePreference[] = ['auto', 'light', 'dark'];
    const currentIndex = prefs.indexOf(preference);
    const nextIndex = (currentIndex + 1) % prefs.length;
    setPreference(prefs[nextIndex]);
  };

  const setAlgorithm = (algo: CalculationAlgorithm) => {
    setAlgorithmState(algo);
    AsyncStorage.setItem(ALGORITHM_STORAGE_KEY, algo);
  };

  const setPvwattsLiveEnabled = (enabled: boolean) => {
    setPvwattsLiveEnabledState(enabled);
    AsyncStorage.setItem(PVWATTS_LIVE_STORAGE_KEY, enabled ? 'true' : 'false');
    // If disabling and currently using a live API algorithm, switch to pvwatts
    if (!enabled && (algorithm === 'pvwatts-live' || algorithm === 'pvwatts-winter')) {
      setAlgorithm('pvwatts');
    }
  };

  const setUseManualLocation = (enabled: boolean) => {
    setUseManualLocationState(enabled);
    AsyncStorage.setItem(USE_MANUAL_LOCATION_KEY, enabled ? 'true' : 'false');
  };

  const setManualCoordinates = (lat: number | null, lon: number | null) => {
    setManualLatitude(lat);
    setManualLongitude(lon);
    if (lat !== null && lon !== null) {
      AsyncStorage.setItem(MANUAL_COORDINATES_KEY, JSON.stringify({ lat, lon }));
    } else {
      AsyncStorage.removeItem(MANUAL_COORDINATES_KEY);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      preference, 
      resolved, 
      colors, 
      setPreference, 
      cyclePreference, 
      algorithm, 
      setAlgorithm, 
      pvwattsLiveEnabled, 
      setPvwattsLiveEnabled,
      useManualLocation,
      setUseManualLocation,
      manualLatitude,
      manualLongitude,
      setManualCoordinates,
      compassInverted,
      setCompassInverted,
      touSettings,
      setTouSettings,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
