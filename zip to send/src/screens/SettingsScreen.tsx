// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  Button,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { useConfig } from '../config/ConfigContext';
import { apiGet } from '../api/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // ensure App exports this type

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'> & {
  onLogout?: () => Promise<void>;
};

export default function SettingsScreen({
  navigation,
  route: _route,
  onLogout,
}: Props) {
  const { theme, toggleTheme } = useTheme();
  const { apiBase, setApiBase, resetToDefault } = useConfig();
  const [input, setInput] = useState<string>(apiBase || '');
  const [testing, setTesting] = useState(false);

  // simple but strict validation: must start with http:// or https:// and have at least one char after that
  const isValidHttpUrl = (val: string) => /^[Hh][Tt][Tt][Pp][Ss]?:\/\/.+/.test(val);

  const trySave = async () => {
    if (!isValidHttpUrl(input)) {
      Alert.alert(
        'Invalid URL',
        'Enter a valid URL starting with http:// or https:// (e.g. http://192.168.1.42:5000)'
      );
      return;
    }

    try {
      await setApiBase(input);
      Alert.alert('Saved', 'Server address saved.');
    } catch (e) {
      console.warn('Save failed', e);
      Alert.alert('Save failed', 'Could not save server address.');
    }
  };

  const doTest = async () => {
    if (!isValidHttpUrl(input)) {
      Alert.alert('Invalid URL', 'Enter a valid URL (must start with http:// or https://).');
      return;
    }

    setTesting(true);
    try {
      // test the provided URL directly by calling its root health endpoint
      // apiGet accepts absolute URLs, so pass the full input
      const res = await apiGet(input); // will attempt GET on input
      Alert.alert('Success', JSON.stringify(res.data));
    } catch (e: any) {
      console.warn('test connection failed', e);
      Alert.alert('Connection failed', e?.message || 'Could not reach the server');
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' ? styles.darkBg : styles.lightBg]}>
      <View style={styles.row}>
        <Text style={[styles.label, theme === 'dark' ? styles.textLight : styles.textDark]}>Dark Mode</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
      </View>

      <View style={{ height: 20 }} />

      <Text style={theme === 'dark' ? styles.textLight : styles.textDark}>Server URL</Text>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="http://192.168.1.42:5000"
        autoCapitalize="none"
        style={[styles.input, theme === 'dark' ? styles.inputDark : styles.inputLight]}
      />

      <View style={{ height: 12 }} />
      <Button title="Save" onPress={trySave} />
      <View style={{ height: 8 }} />
      <Button title={testing ? 'Testing...' : 'Test Connection'} onPress={doTest} disabled={testing} />

      <View style={{ height: 20 }} />

      <Button title="Reset to default" onPress={() => resetToDefault()} />

      <View style={{ height: 20 }} />

      <Button
        title="Log out"
        color="#d9534f"
        onPress={async () => {
          if (onLogout) await onLogout();
          else {
            await AsyncStorage.removeItem('customer_code');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 18 },
  lightBg: { backgroundColor: '#fff' },
  darkBg: { backgroundColor: '#111' },
  textLight: { color: '#fff' },
  textDark: { color: '#000' },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, marginTop: 6 },
  inputLight: { borderColor: '#ccc', backgroundColor: '#fff', color: '#000' },
  inputDark: { borderColor: '#333', backgroundColor: '#222', color: '#fff' },
});
