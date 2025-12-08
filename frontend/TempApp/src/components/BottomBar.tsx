// src/components/BottomBar.tsx
import React, { FC } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../theme/typography';  // 👈 added FONT_WEIGHT

interface BottomBarProps {
  labels: string[];
  activePanel: string | null;
  activeRpfSub: string | null; 
  onPressItem: (label: string) => void;
  rpfRef?: any;
  onExit: () => void;
  onSave: () => void;
  onSettings: () => void;
}

const BottomBar: FC<BottomBarProps> = ({
  labels,
  activePanel,
  activeRpfSub,
  onPressItem,
  rpfRef,
  onExit,
  onSave,
  onSettings,
}) => {
  return (
    <View style={styles.bottomBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomBarScroll}
      >
        {labels.map((label, idx) => {
          const isActive =
          activePanel === label ||
          (label === "RPF" && activeRpfSub !== null);

          return (
            <TouchableOpacity
              key={label + idx}
              ref={label === 'RPF' ? rpfRef : undefined}
              activeOpacity={0.9}
              onPress={() => onPressItem(label)}
              style={[
                styles.pillButton,
                isActive && styles.pillButtonActive,
              ]}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}


        {/* SETTINGS Button */}
        <TouchableOpacity activeOpacity={0.9} onPress={onSettings} style={styles.settingsPill}>
          <Icon name="settings" size={FONT_SIZE.header} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.settingsText}>SETTINGS</Text>
        </TouchableOpacity>

        {/* EXIT Button */}
        <TouchableOpacity activeOpacity={0.9} onPress={onExit} style={styles.exitPill}>
          <Icon name="logout" size={FONT_SIZE.header} color="#6b0f1a" style={{ marginRight: 8 }} />
          <Text style={styles.exitText}>EXIT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default BottomBar;

/* ============================================================
                      STYLES
============================================================ */

const BUTTON_HEIGHT = 50;
const BUTTON_WIDTH = 119;

const styles = StyleSheet.create({
  bottomBarContainer: {
    borderTopWidth: 1,
    borderTopColor: '#cfcfcf',
    backgroundColor: '#e6e6e8',
    paddingVertical: 4,
  },

  bottomBarScroll: {
    alignItems: 'center',
    paddingHorizontal: 6,
    flexDirection: 'row',
  },

  /* MAIN NAV BUTTONS */
  pillButton: {
    backgroundColor: '#e9e5f6',
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 5,
    borderTopColor: '#7f8294ff',
    borderLeftColor: '#7f8294ff',
    borderBottomColor: '#7f8294ff',
    borderRightColor: '#7f8294ff',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillButtonActive: {
    backgroundColor: '#3C78D8',
    borderTopColor: '#bdbdbf',
    borderLeftColor: '#bdbdbf',
    borderBottomColor: '#bdbdbf',
    borderRightColor: '#bdbdbf',
  },

  pillText: {
    color: '#211f2e',
    fontFamily: FONT_FAMILY.regular,
    fontSize: FONT_SIZE.label,
    fontWeight: FONT_WEIGHT.bold,        // 👈 added
    textAlign: 'center',
    width: BUTTON_WIDTH - 10,
  },

  pillTextActive: {
    color: '#000',
  },

  /* SETTINGS BUTTON */
  settingsPill: {
    backgroundColor: '#444',
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderRightWidth: 1,
     borderTopColor: '#7f8294ff',
    borderBottomColor: '#7f8294ff',
    borderRightColor: '#7f8294ff',
     borderLeftColor: '#7f8294ff',
  },
  settingsText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.regular,
    fontSize: FONT_SIZE.header,
    fontWeight: FONT_WEIGHT.bold,        // 👈 added
  },

  /* EXIT BUTTON */
  exitPill: {
    backgroundColor: '#ffd0d6',
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderTopColor: '#fff',
    borderBottomColor: '#df9aa6',
    borderRightColor: '#df9aa6',
    borderWidth: 1,
  },
  exitText: {
    color: '#6b0f1a',
    fontFamily: FONT_FAMILY.bold,
    fontSize: FONT_SIZE.header,
    fontWeight: FONT_WEIGHT.bold,        // 👈 added
  },
});
