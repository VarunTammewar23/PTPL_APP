// src/screens/LoginScreen.tsx (snippets)
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      // use wrapper
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
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {/* settings button visible on login */}
      <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={{ color: '#007bff' }}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* existing login UI */}
      <View style={{ marginBottom: 12 }}>
        <Text>Enter Customer Code</Text>
        <TextInput value={code} onChangeText={setCode} placeholder="e.g. 1001" />
      </View>
      <Button title={loading ? 'Checking...' : 'Login'} onPress={tryLogin} disabled={loading} />
    </KeyboardAvoidingView>
  );
}
