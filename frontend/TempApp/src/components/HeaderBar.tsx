import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface Props {
  recipeId: number;
  recipeName: string | null;
  onSave: () => void;
  onUpload: () => void;
}

export default function HeaderBar({ recipeId, recipeName, onSave, onUpload }: Props) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.wrapper}>
      {/* ROW 1 */}
      <View style={styles.row1}>

        {/* Logo */}
        <Image
          source={require('../assets/company_logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Recipe No */}
        <Text style={styles.label}>Recipe No:</Text>
        <Text style={styles.inputBox}>
          {recipeId !== -1 ? recipeId : "--"}
        </Text>

        {/* Recipe Name */}
        <Text style={[styles.label, { marginLeft: 10 }]}>Recipe Name:</Text>
        <Text style={[styles.inputBox, { minWidth: 120 }]}>
          {recipeName ?? "--"}
        </Text>

        {/* DATE + SETTINGS ICON */}
        <View style={styles.rightSide}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString().slice(0, 5)}
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Icon name="settings" size={26} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ROW 2 BUTTONS */}
      <View style={styles.row2}>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.btnText}>Save Current Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBtn} onPress={onUpload}>
          <Text style={styles.btnText}>Upload Recipe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#d6e4f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    elevation: 5,
  },

  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'nowrap',
  },

  logo: {
    width: 100,
    height: 100,
    marginRight: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
  },

  inputBox: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginHorizontal: 6,
    fontWeight: '700',
    textAlign: 'center',
  },

  rightSide: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },

  date: {
    marginRight: 10,
    fontWeight: '700',
  },

  row2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },

  saveBtn: {
    backgroundColor: '#006edc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },

  uploadBtn: {
    backgroundColor: '#008a3e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },

  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
