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

interface BottomBarProps {
  labels: string[];
  activePanel: string | null;
  onPressItem: (label: string) => void;
  rpfRef?: any;
  onExit: () => void;
  onSave: () => void;
  onSettings: () => void;  // <-- ADD THIS LINE
}



const BottomBar: FC<BottomBarProps> = ({
  labels,
  activePanel,
  onPressItem,
  rpfRef,
  onExit,
  onSave,
  onSettings,    // <-- ADD THIS

}) => {
  return (
    <View style={styles.bottomBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomBarScroll}
      >
        {labels.map((label, idx) => {
          const isActive = activePanel === label;
          return (
            <TouchableOpacity
              key={label + idx}
              ref={label === 'RPF' ? rpfRef : undefined}
              activeOpacity={0.9}
              onPress={() => onPressItem(label)}
              style={[
                styles.pillButton,
                isActive && styles.pillButtonActive,
                idx === labels.length - 1 && styles.lastPill,
              ]}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* SAVE Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSave}
          style={styles.savePill}
        >
          <Icon name="save" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.saveText}>SAVE</Text>
        </TouchableOpacity>

        {/* SETTINGS button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSettings}
          style={styles.settingsPill}
        >
          <Icon name="settings" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.settingsText}>SETTINGS</Text>
        </TouchableOpacity>

        {/* EXIT button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onExit}
          style={styles.exitPill}
        >
          <Icon name="logout" size={18} color="#6b0f1a" style={{ marginRight: 8 }} />
          <Text style={styles.exitText}>EXIT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default BottomBar;

const BUTTON_HEIGHT = 50;   // universal height
const BUTTON_WIDTH = 120;   // universal width for all buttons
const FONT_SIZE = 15;       // universal font size

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

  // ALL MAIN BUTTONS (RPF, RECIPE, etc.)
  pillButton: {
    backgroundColor: '#e9e5f6',
    width: BUTTON_WIDTH,          // 🔥 FIXED WIDTH
    height: BUTTON_HEIGHT,        // 🔥 FIXED HEIGHT
    borderRadius: 0,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomColor: '#bdb6d9',
    borderRightColor: '#bdb6d9',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillButtonActive: {
    backgroundColor: '#d6d6d8',
    borderTopColor: '#bdbdbf',
    borderLeftColor: '#bdbdbf',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
  },

  pillText: {
    color: '#211f2e',
    fontWeight: '700',
    fontSize: FONT_SIZE,
    letterSpacing: 0.4,
    textAlign: 'center',
    width: BUTTON_WIDTH - 10,     // ensures text fits & doesn't overflow
  },

  pillTextActive: {
    color: '#000',
  },

  /* SAVE BUTTON */
  savePill: {
    backgroundColor: '#006edc',
    width: BUTTON_WIDTH,          // 🔥 SAME FIXED WIDTH
    height: BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    borderRightWidth: 1,          // join with exit
    borderRightColor: '#0055a8',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FONT_SIZE,
  },

  /* EXIT BUTTON */
  exitPill: {
    backgroundColor: '#ffd0d6',
    width: BUTTON_WIDTH,          // 🔥 SAME FIXED WIDTH
    height: BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    borderLeftWidth: 0,           // no gap next to SAVE
    borderTopColor: '#fff',
    borderBottomColor: '#df9aa6',
    borderRightColor: '#df9aa6',
    borderWidth: 1,
  },
  exitText: {
    color: '#6b0f1a',
    fontWeight: '800',
    fontSize: FONT_SIZE,
  },
  settingsPill: {
  backgroundColor: '#444',  // dark grey like Android settings
  width: BUTTON_WIDTH,
  height: BUTTON_HEIGHT,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 0,
  borderRightWidth: 1,
  borderRightColor: '#000',
},
settingsText: {
  color: '#fff',
  fontWeight: '800',
  fontSize: FONT_SIZE,
},

});

