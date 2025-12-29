import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CREASING_OPTIONS } from './CreasingOptions';

type Props = {
  value: string | null;
  onChange: (val: string) => void;
};

const CreasingDropdown = ({ value, onChange }: Props) => {
  const selected = CREASING_OPTIONS.find(o => o.value === value);

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={styles.picker}
      >
        <Picker.Item label="Select" value={null} />
        {CREASING_OPTIONS.map(opt => (
          <Picker.Item
            key={opt.value}
            label={opt.label}
            value={opt.value}
          />
        ))}
      </Picker>

      {selected && (
        <Image
          source={selected.image}
          style={styles.image}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

export default CreasingDropdown;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  picker: {
    width: 90,
    height: 40,
  },
  image: {
    width: 80,
    height: 60,
    marginTop: 6,
  },
});
