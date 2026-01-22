// src/components/BottomBar.tsx
import React, { FC } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../ui/typography';  // 👈 added FONT_WEIGHT
import { s, fs, clamp } from '../ui/scale';


interface BottomBarProps {
  labels: string[];
  activePanel: string | null;
  activeSubScreen: string | null;
  onPressItem: (label: string) => void;
  panelRefs: React.MutableRefObject<Record<string, any>>;
  onExit: () => void;
  onSave: () => void;
  onSettings: () => void;
  disabledLabels?: string[];
}


const BottomBar: FC<BottomBarProps> = ({
  labels,
  activePanel,
  activeSubScreen,
  onPressItem,
  disabledLabels = [],
  panelRefs,
  onExit,
  onSave,
  onSettings,
}) => {

  return (
    <View style={styles.bottomBarContainer}>
      <View style={styles.bottomBarRow}>

        {labels.map((label, idx) => {
  const isDisabled = disabledLabels?.includes(label);

const isActive =
  !isDisabled &&
  (activePanel === label ||
    activeSubScreen !== null && activePanel === label);


          return (
            <TouchableOpacity
  key={label + idx}
  ref={el => {
    if (panelRefs?.current && el) {
      panelRefs.current[label] = el;
    }
  }}
  activeOpacity={isDisabled ? 1 : 0.9}
  onPress={() => !isDisabled && onPressItem(label)}
  disabled={isDisabled}


              style={[
                      styles.pillButton,
                      isActive && styles.pillButtonActive,
                      isDisabled && styles.pillButtonDisabled,
                    ]}

            >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.pillText,
                isActive && styles.pillTextActive,
                isDisabled && styles.pillTextDisabled,
              ]}
            >
              {label}
            </Text>

            </TouchableOpacity>
          );
        })}

        


        {/* SETTINGS Button */}
        <TouchableOpacity activeOpacity={0.9} onPress={onSettings} style={styles.settingsPill}>
          <Icon name="settings" size={FONT_SIZE.button} color="#211f2e" style={{ marginRight: 3 }} />
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.settingsText}>SETTINGS</Text>
        </TouchableOpacity>

        {/* EXIT Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onExit}
            style={styles.exitPill}
          >
          <Icon name="logout" size={FONT_SIZE.header} color="#6b0f1a" style={{ marginRight: 8 }} />
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.exitText}>EXIT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
  

export default BottomBar;

/* ============================================================
                      STYLES
============================================================ */

const BUTTON_HEIGHT = 50;
const BUTTON_WIDTH = 115;

const styles = StyleSheet.create({
  bottomBarContainer: {
    borderTopWidth: 0,
    borderTopColor: '#ffffffff',
    backgroundColor: '#ffffffff',
    paddingVertical: 4,
    paddingHorizontal: 4,
    width: '100%',
  },

  bottomBarScroll: {
    alignItems: 'center',
    paddingHorizontal: 6,
    flexDirection: 'row',
  },

  bottomBarRow: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',              // fill screen
  flexWrap: 'wrap'     
  },   // allow wrapping


  /* MAIN NAV BUTTONS */
  pillButton: {
    backgroundColor: '#e9e5f6',
    width: clamp(s(115), 90, 120),
    height: clamp(s(50), 42, 54),
    borderRadius: 5,
    borderTopColor: '#7f8294ff',
    borderLeftColor: '#7f8294ff',
    borderBottomColor: '#7f8294ff',
    borderRightColor: '#7f8294ff',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 1,
    flexShrink: 1,   // allow compression
    flexGrow: 1,          // fill available space        
    flexBasis: 0,         // equal distribution
    minWidth: 90,         // lower safety
    maxWidth: 140,        // upper safety

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
    fontSize: fs(FONT_SIZE.button),
    fontWeight: FONT_WEIGHT.bold,        // 👈 added
    textAlign: 'center',
  },

  pillTextActive: {
    color: '#000',
  },

  /* SETTINGS BUTTON */
  settingsPill: {
    backgroundColor: '#e9e5f6',
    width: clamp(s(115), 90, 120),
    height: clamp(s(50), 42, 54),
    flexShrink: 1,
    borderRadius: 5,
    borderTopColor: '#7f8294ff',
    borderLeftColor: '#7f8294ff',
    borderBottomColor: '#7f8294ff',
    borderRightColor: '#7f8294ff',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 1,
  },
  settingsText: {
    color: '#211f2e',
    fontFamily: FONT_FAMILY.regular,
    fontSize: fs(FONT_SIZE.button),
    fontWeight: FONT_WEIGHT.bold,        // 👈 added
  },

  /* EXIT BUTTON */
  exitPill: {
    backgroundColor: '#ffd0d6',
    width: clamp(s(115), 90, 120),
    height: clamp(s(50), 42, 54),
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderTopColor: '#ff798fff',
    borderBottomColor: '#ff798fff',
    borderRightColor: '#ff798fff',
    borderLeftColor: '#ff798fff',
    borderWidth: 1,

  },
  exitText: {
    color: '#6b0f1a',
    fontFamily: FONT_FAMILY.bold,
    fontSize: fs(FONT_SIZE.button),
    fontWeight: FONT_WEIGHT.bold,        // 👈 added
  },

  pillButtonDisabled: {
  backgroundColor: '#d6d6d6',
  borderColor: '#b0b0b0',
  opacity: 0.6,
},

});