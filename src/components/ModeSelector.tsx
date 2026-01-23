import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AlignmentMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { triggerSelectionHaptic } from '../hooks/useHapticFeedback';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
};

interface ModeSelectorProps {
  mode: AlignmentMode;
  onModeChange: (mode: AlignmentMode) => void;
}

const modes: { key: AlignmentMode; label: string }[] = [
  { key: 'year-round', label: 'Year-Round' },
  { key: 'seasonal', label: 'Seasonal' },
  { key: 'daily', label: 'Daily' },
];

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const { colors } = useTheme();

  const handlePress = async (newMode: AlignmentMode) => {
    if (newMode !== mode) {
      await triggerSelectionHaptic();
      onModeChange(newMode);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.buttons, { backgroundColor: colors.panelLight }]}>
        {modes.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              mode === key && { backgroundColor: colors.border },
            ]}
            onPress={() => handlePress(key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: colors.textDim },
              mode === key && { color: colors.green },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttons: {
    flexDirection: 'row',
    borderRadius: 4,
    padding: 2,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 3,
  },
  tabText: {
    fontSize: 12,
    fontFamily: FONT.regular,
  },
});
