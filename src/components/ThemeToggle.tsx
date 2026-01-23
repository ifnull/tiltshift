import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { triggerSelectionHaptic } from '../hooks/useHapticFeedback';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
};

export function ThemeToggle() {
  const { preference, colors, cyclePreference } = useTheme();

  const handlePress = async () => {
    await triggerSelectionHaptic();
    cyclePreference();
  };

  const getIcon = () => {
    switch (preference) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '⚙️';
    }
  };

  const getLabel = () => {
    switch (preference) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Auto';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.panelLight, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={[styles.label, { color: colors.textDim }]}>{getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
});
