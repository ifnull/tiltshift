import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts, RobotoMono_400Regular, RobotoMono_500Medium, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AlignmentScreen } from './src/screens/AlignmentScreen';
import { ARScreen } from './src/screens/ARScreen';
import { CompassScreen } from './src/screens/CompassScreen';
import { PanelScreen } from './src/screens/PanelScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { AlignmentMode } from './src/types';

type Screen = 'panel' | 'tilt' | 'compass' | 'settings' | 'ar';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('panel');
  // Alignment mode lives here (not in PanelScreen) so it persists across
  // navigation to AR and other screens.
  const [alignmentMode, setAlignmentMode] = useState<AlignmentMode>('year-round');
  const { resolved } = useTheme();

  const goToPanel = () => setCurrentScreen('panel');

  return (
    <>
      <StatusBar style={resolved === 'light' ? 'dark' : 'light'} />
      {currentScreen === 'panel' && (
        <PanelScreen
          mode={alignmentMode}
          onModeChange={setAlignmentMode}
          onSwitchToTilt={() => setCurrentScreen('tilt')}
          onSwitchToCompass={() => setCurrentScreen('compass')}
          onSwitchToSettings={() => setCurrentScreen('settings')}
          onSwitchToAR={() => setCurrentScreen('ar')}
        />
      )}
      {currentScreen === 'tilt' && (
        <AlignmentScreen onBack={goToPanel} />
      )}
      {currentScreen === 'compass' && (
        <CompassScreen onBack={goToPanel} />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen onBack={goToPanel} />
      )}
      {currentScreen === 'ar' && (
        <ARScreen mode={alignmentMode} onBack={goToPanel} />
      )}
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
    RobotoMono_500Medium,
    RobotoMono_700Bold,
    ShareTechMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ffaa00" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
