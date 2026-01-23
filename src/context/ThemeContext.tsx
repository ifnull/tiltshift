import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = '@tiltsync_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');

  // Resolve the actual theme based on preference and system setting
  const resolved: ResolvedTheme = 
    preference === 'auto' 
      ? (systemColorScheme === 'light' ? 'light' : 'dark')
      : preference;

  const colors = resolved === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    // Load saved preference
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'auto' || saved === 'light' || saved === 'dark') {
        setPreferenceState(saved);
      }
    });
  }, []);

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

  return (
    <ThemeContext.Provider value={{ preference, resolved, colors, setPreference, cyclePreference }}>
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
