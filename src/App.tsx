import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AlignmentScreen, CompassScreen } from './screens';

type Screen = 'alignment' | 'compass';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('alignment');

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {currentScreen === 'alignment' ? (
        <AlignmentScreen onSwitchToCompass={() => setCurrentScreen('compass')} />
      ) : (
        <CompassScreen onSwitchToAlignment={() => setCurrentScreen('alignment')} />
      )}
    </SafeAreaProvider>
  );
}
