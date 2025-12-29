import React from 'react';
import { View, StyleSheet } from 'react-native';
import CreasingDropdown from './CreasingDropdown';

type Props = {
  values: (string | null)[];
  onChange: (index: number, value: string) => void;
};

const CreasingRow = ({ values, onChange }: Props) => {
  return (
    <View style={styles.row}>
      {values.map((val, idx) => (
        <CreasingDropdown
          key={idx}
          value={val}
          onChange={(v) => onChange(idx, v)}
        />
      ))}
    </View>
  );
};

export default CreasingRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 12,
  },
});
