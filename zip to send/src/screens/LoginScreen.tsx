// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  Keyboard,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { apiPost } from '../api/api';
import { useConfig } from '../config/ConfigContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen({ onLogin }: { onLogin: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { apiBase } = useConfig();

  const tryLogin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert('Enter code');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/login', { customer_code: trimmed }, { timeout: 7000 });
      if (res.data?.customer) {
        await AsyncStorage.setItem('customer_code', trimmed);
        onLogin(trimmed);
      } else {
        Alert.alert('Login failed', 'Invalid response from server');
      }
    } catch (e: any) {
      console.warn('Login error, apiBase=', apiBase, e);
      Alert.alert('Login failed', e.response?.data?.error || e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'android' ? 120 : 20}
      keyboardOpeningTime={250}
      keyboardShouldPersistTaps="handled"
    >
      {/* settings button visible on login */}
      <View style={styles.settingsRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* login card */}
      <View style={styles.card}>
        <Text style={styles.label}>Enter Customer Code</Text>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="e.g. 1001"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            tryLogin();
          }}
          style={styles.input}
        />

        <View style={styles.buttonWrap}>
          <Button title={loading ? 'Checking...' : 'Login'} onPress={tryLogin} disabled={loading} />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  settingsRow: { alignItems: 'flex-end', marginBottom: 12 },
  settingsText: { color: '#007bff', fontSize: 14 },
  card: { marginBottom: 12 },
  label: { fontSize: 18, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  buttonWrap: { marginTop: 4 },
});
