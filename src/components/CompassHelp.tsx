import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const FONT = {
  regular: 'RobotoMono_400Regular',
  medium: 'RobotoMono_500Medium',
  bold: 'RobotoMono_700Bold',
};

export function CompassHelp() {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity 
        style={[styles.helpButton, { backgroundColor: colors.panelLight, borderColor: colors.border }]} 
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.helpButtonText, { color: colors.amber }]}>?</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.amber }]}>COMPASS CALIBRATION</Text>
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>If compass is inaccurate:</Text>
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: colors.amber, color: colors.panel }]}>1</Text>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Move away from metal objects, electronics, and magnets
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: colors.amber, color: colors.panel }]}>2</Text>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Wave your device in a figure-8 pattern several times
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: colors.amber, color: colors.panel }]}>3</Text>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Rotate device slowly on all three axes
                </Text>
              </View>
            </View>

            <View style={[styles.figure8Container, { backgroundColor: colors.panelLight }]}>
              <Text style={[styles.figure8, { color: colors.amber }]}>∞</Text>
              <Text style={[styles.figure8Label, { color: colors.textDim }]}>Figure-8 Motion</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Common interference sources:</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Phone cases with magnets</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Metal tables or railings</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Nearby electronics</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Car dashboards</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Power lines overhead</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for best accuracy:</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Keep device level when measuring</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Wait for readings to stabilize</Text>
              <Text style={[styles.bulletText, { color: colors.textDim }]}>• Recalibrate after traveling</Text>
            </View>

            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.panelLight, borderColor: colors.border }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  helpButtonText: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    maxWidth: 340,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONT.bold,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: FONT.medium,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONT.bold,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT.regular,
  },
  figure8Container: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
  },
  figure8: {
    fontSize: 48,
  },
  figure8Label: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: FONT.regular,
  },
  bulletText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: FONT.regular,
  },
  closeButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: FONT.medium,
  },
});
