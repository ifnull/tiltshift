import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import type { TouBlock, TouSettings } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../hooks';

// Get version info from app config
const appVersion = Constants.expoConfig?.version ?? '1.0.0';
const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString() ?? '1';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

interface SettingsScreenProps {
  onBack: () => void;
}

// Validate latitude (-90 to 90)
function isValidLatitude(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num >= -90 && num <= 90;
}

// Validate longitude (-180 to 180)
function isValidLongitude(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num >= -180 && num <= 180;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { 
    colors, 
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
  } = useTheme();
  
  const { location: gpsLocation } = useLocation();
  
  // Local state for input fields
  const [latInput, setLatInput] = useState(manualLatitude?.toString() ?? '');
  const [lonInput, setLonInput] = useState(manualLongitude?.toString() ?? '');
  const [latError, setLatError] = useState(false);
  const [lonError, setLonError] = useState(false);
  
  // Sync local state when context values change
  useEffect(() => {
    if (manualLatitude !== null) {
      setLatInput(manualLatitude.toString());
    }
    if (manualLongitude !== null) {
      setLonInput(manualLongitude.toString());
    }
  }, [manualLatitude, manualLongitude]);
  
  // Validate and save coordinates
  const handleLatChange = (text: string) => {
    setLatInput(text);
    if (text === '' || isValidLatitude(text)) {
      setLatError(false);
      const lat = text === '' ? null : parseFloat(text);
      const lon = lonInput === '' ? null : parseFloat(lonInput);
      if (lat !== null && lon !== null && isValidLongitude(lonInput)) {
        setManualCoordinates(lat, lon);
      }
    } else {
      setLatError(true);
    }
  };
  
  const handleLonChange = (text: string) => {
    setLonInput(text);
    if (text === '' || isValidLongitude(text)) {
      setLonError(false);
      const lat = latInput === '' ? null : parseFloat(latInput);
      const lon = text === '' ? null : parseFloat(text);
      if (lat !== null && lon !== null && isValidLatitude(latInput)) {
        setManualCoordinates(lat, lon);
      }
    } else {
      setLonError(true);
    }
  };
  
  // Fill with current GPS location
  const handleUseCurrentLocation = () => {
    if (gpsLocation) {
      const lat = parseFloat(gpsLocation.latitude.toFixed(4));
      const lon = parseFloat(gpsLocation.longitude.toFixed(4));
      setLatInput(lat.toString());
      setLonInput(lon.toString());
      setLatError(false);
      setLonError(false);
      setManualCoordinates(lat, lon);
      Keyboard.dismiss();
    }
  };
  
  const hasValidManualLocation = manualLatitude !== null && manualLongitude !== null;

  const updateTouBlock = (index: number, field: keyof TouBlock, value: number) => {
    const next = [...touSettings.blocks];
    if (!next[index]) return;
    next[index] = { ...next[index], [field]: value };
    setTouSettings({ ...touSettings, blocks: next });
  };

  const updateSellback = (value: string) => {
    const n = value === '' ? null : parseFloat(value);
    setTouSettings({ ...touSettings, sellbackCentsPerKwh: n === null || isNaN(n) ? null : n });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.panel }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.textDim }]}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.amber }]}>SETTINGS</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>LOCATION</Text>
            
            <View style={[styles.settingCard, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
              {/* Auto/Manual Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Manual Coordinates
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textDim }]}>
                    Enter custom coordinates instead of using GPS. Useful for planning remote installations.
                  </Text>
                </View>
                <Switch
                  value={useManualLocation}
                  onValueChange={setUseManualLocation}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.text}
                />
              </View>
              
              {/* Coordinate inputs (shown when manual is enabled) */}
              {useManualLocation && (
                <>
                  <View style={[styles.coordinateInputs, { borderTopColor: colors.border }]}>
                    <View style={styles.inputRow}>
                      <Text style={[styles.inputLabel, { color: colors.textDim }]}>Latitude</Text>
                      <TextInput
                        style={[
                          styles.input,
                          { 
                            color: colors.text, 
                            backgroundColor: colors.panel,
                            borderColor: latError ? colors.red : colors.border 
                          }
                        ]}
                        value={latInput}
                        onChangeText={handleLatChange}
                        placeholder="-90 to 90"
                        placeholderTextColor={colors.textDim}
                        keyboardType="numbers-and-punctuation"
                        returnKeyType="done"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={[styles.inputLabel, { color: colors.textDim }]}>Longitude</Text>
                      <TextInput
                        style={[
                          styles.input,
                          { 
                            color: colors.text, 
                            backgroundColor: colors.panel,
                            borderColor: lonError ? colors.red : colors.border 
                          }
                        ]}
                        value={lonInput}
                        onChangeText={handleLonChange}
                        placeholder="-180 to 180"
                        placeholderTextColor={colors.textDim}
                        keyboardType="numbers-and-punctuation"
                        returnKeyType="done"
                      />
                    </View>
                    
                    {gpsLocation && (
                      <TouchableOpacity
                        style={[styles.useGpsButton, { borderColor: colors.border }]}
                        onPress={handleUseCurrentLocation}
                      >
                        <Text style={[styles.useGpsButtonText, { color: colors.amber }]}>
                          📍 Use Current GPS Location
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={[styles.settingNote, { borderTopColor: colors.border }]}>
                    <Text style={[styles.noteText, { color: useManualLocation && hasValidManualLocation ? colors.green : colors.textDim }]}>
                      {useManualLocation && hasValidManualLocation 
                        ? `✓ Using manual location: ${manualLatitude?.toFixed(4)}°, ${manualLongitude?.toFixed(4)}°`
                        : '⚠ Enter valid coordinates to enable manual mode'
                      }
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Display Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>DISPLAY</Text>
            
            <View style={[styles.settingCard, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Invert compass 180°
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textDim }]}>
                    Flip the compass so it reads correctly when you're holding the phone toward the sun or have it laid screen-down on the panel.
                  </Text>
                </View>
                <Switch
                  value={compassInverted}
                  onValueChange={setCompassInverted}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.text}
                />
              </View>
            </View>
          </View>

          {/* Time-of-use Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>TIME-OF-USE RATES</Text>
            
            <View style={[styles.settingCard, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Use time-of-use rates
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textDim }]}>
                    Recommend E–W panel angle to maximize savings when rates vary by time (e.g. peak afternoon). Enter rates in ¢/kWh.
                  </Text>
                </View>
                <Switch
                  value={touSettings.enabled}
                  onValueChange={(enabled) => setTouSettings({ ...touSettings, enabled })}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.text}
                />
              </View>
              
              {touSettings.enabled && (
                <>
                  <View style={[styles.coordinateInputs, { borderTopColor: colors.border }]}>
                    {touSettings.blocks.map((block, i) => (
                      <View key={i} style={[styles.touBlockRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={[styles.touBlockLabel, { color: colors.textDim }]}>Block {i + 1}</Text>
                        <View style={styles.touBlockInputs}>
                          <View style={styles.touInputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textDim }]}>Start</Text>
                            <TextInput
                              style={[styles.input, styles.touInput, { color: colors.text, backgroundColor: colors.panel, borderColor: colors.border }]}
                              value={String(block.startHour)}
                              onChangeText={(t) => updateTouBlock(i, 'startHour', Math.max(0, Math.min(23, parseInt(t, 10) || 0)))}
                              placeholder="0"
                              placeholderTextColor={colors.textDim}
                              keyboardType="number-pad"
                            />
                          </View>
                          <View style={styles.touInputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textDim }]}>End</Text>
                            <TextInput
                              style={[styles.input, styles.touInput, { color: colors.text, backgroundColor: colors.panel, borderColor: colors.border }]}
                              value={String(block.endHour)}
                              onChangeText={(t) => updateTouBlock(i, 'endHour', Math.max(1, Math.min(24, parseInt(t, 10) || 24)))}
                              placeholder="24"
                              placeholderTextColor={colors.textDim}
                              keyboardType="number-pad"
                            />
                          </View>
                          <View style={styles.touInputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textDim }]}>¢/kWh</Text>
                            <TextInput
                              style={[styles.input, styles.touInput, { color: colors.text, backgroundColor: colors.panel, borderColor: colors.border }]}
                              value={String(block.rateCentsPerKwh)}
                              onChangeText={(t) => updateTouBlock(i, 'rateCentsPerKwh', Math.max(0, parseFloat(t) || 0))}
                              placeholder="0"
                              placeholderTextColor={colors.textDim}
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                    <View style={[styles.touBlockRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.touBlockLabel, { color: colors.textDim }]}>Sellback (optional)</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.panel, borderColor: colors.border, flex: 1 }]}
                        value={touSettings.sellbackCentsPerKwh != null ? String(touSettings.sellbackCentsPerKwh) : ''}
                        onChangeText={updateSellback}
                        placeholder="¢/kWh"
                        placeholderTextColor={colors.textDim}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View style={[styles.settingNote, { borderTopColor: colors.border }]}>
                    <Text style={[styles.noteText, { color: colors.textDim }]}>
                      Hours are 0–24 (e.g. peak 14–18). When enabled, the recommended compass direction tilts toward higher-rate hours (e.g. more west for afternoon peak).
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* API Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>API SETTINGS</Text>
            
            <View style={[styles.settingCard, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    PVWatts Live API
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textDim }]}>
                    Enable real-time calculations from NREL's PVWatts API for industry-standard tilt recommendations.
                  </Text>
                </View>
                <Switch
                  value={pvwattsLiveEnabled}
                  onValueChange={setPvwattsLiveEnabled}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.text}
                />
              </View>
              
              <View style={[styles.settingNote, { borderTopColor: colors.border }]}>
                <Text style={[styles.noteText, { color: colors.textDim }]}>
                  ⚡ Requires internet connection. Uses your location to query optimal tilt angles from the National Renewable Energy Laboratory.
                </Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>ABOUT</Text>
            
            <View style={[styles.settingCard, { backgroundColor: colors.panelLight, borderColor: colors.border }]}>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textDim }]}>Version</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{appVersion}</Text>
              </View>
              <View style={[styles.aboutRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                <Text style={[styles.aboutLabel, { color: colors.textDim }]}>Build</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{buildNumber}</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 70,
  },
  backText: {
    fontSize: 14,
    fontFamily: FONT.regular,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.bold,
    letterSpacing: 2,
  },
  headerSpacer: {
    minWidth: 70,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: FONT.medium,
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: FONT.medium,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
  },
  settingNote: {
    padding: 12,
    borderTopWidth: 1,
  },
  noteText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    lineHeight: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  aboutLabel: {
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  aboutValue: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  coordinateInputs: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    width: 70,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FONT.regular,
  },
  useGpsButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  useGpsButtonText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  touBlockRow: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  touBlockLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  touBlockInputs: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  touInputGroup: {
    flex: 1,
    minWidth: 70,
  },
  touInput: {
    minWidth: 56,
  },
});
