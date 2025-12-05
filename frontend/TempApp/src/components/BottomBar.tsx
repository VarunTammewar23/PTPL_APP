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
  onSave: () => void;  // NEW
}

const BottomBar: FC<BottomBarProps> = ({
  labels,
  activePanel,
  onPressItem,
  rpfRef,
  onExit,
  onSave,
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

const styles = StyleSheet.create({
  bottomBarContainer: {
    borderTopWidth: 1,
    borderTopColor: '#cfcfcf',
    backgroundColor: '#e6e6e8',
    paddingVertical: 10,
  },
  bottomBarScroll: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pillButton: {
    backgroundColor: '#e9e5f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 0,
    marginRight: 0,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomColor: '#bdb6d9',
    borderRightColor: '#bdb6d9',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    height: 48,
  },
  lastPill: {
    borderRightWidth: 0,
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
    fontSize: 12,
    letterSpacing: 0.5,
  },
  pillTextActive: {
    color: '#000',
  },

  /* SAVE STYLES */
  savePill: {
    backgroundColor: '#006edc',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    height: 48,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  /* EXIT */
  exitPill: {
    backgroundColor: '#ffd0d6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderBottomColor: '#df9aa6',
    borderRightColor: '#df9aa6',
    borderWidth: 1,
    height: 48,
  },
  exitText: {
    color: '#6b0f1a',
    fontWeight: '800',
    fontSize: 14,
  },
});
