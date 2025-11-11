// App.tsx (navigation with Machine screen)
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { ConfigProvider } from './src/config/ConfigContext';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MachineScreen from './src/screens/MachineScreen'; // <-- new

// Central navigation type used by App and screens
export type RootStackParamList = {
  Login: undefined;
  Settings: undefined;
  Main: undefined;
  Machine: { recipeId: number; recipeName?: string; imageUri?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const CUSTOMER_CODE_KEY = 'customer_code';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [customerCode, setCustomerCode] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const code = await AsyncStorage.getItem(CUSTOMER_CODE_KEY);
        if (code) setCustomerCode(code);
      } catch (e) {
        console.warn('Error reading stored customer code', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async (code: string) => {
    try {
      await AsyncStorage.setItem(CUSTOMER_CODE_KEY, code);
      setCustomerCode(code);
    } catch (e) {
      console.warn('Failed to persist customer code on login', e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(CUSTOMER_CODE_KEY);
      setCustomerCode(null);
    } catch (e) {
      console.warn('Error during logout', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <ThemeProvider>
      <ConfigProvider>
        <StatusBar barStyle="default" />
        <NavigationContainer theme={DefaultTheme}>
          <Stack.Navigator initialRouteName={customerCode ? 'Main' : 'Login'}>
            {customerCode ? (
              <>
                <Stack.Screen
                  name="Main"
                  children={() => <MainScreen customerCode={customerCode} />}
                />
                <Stack.Screen
                  name="Settings"
                  children={({ navigation, route }) => (
                    <SettingsScreen navigation={navigation} route={route} onLogout={handleLogout} />
                  )}
                />
                <Stack.Screen
                  name="Machine"
                  component={MachineScreen}
                />
              </>
            ) : (
              <>
                <Stack.Screen
                  name="Login"
                  children={() => <LoginScreen onLogin={handleLogin} />}
                />
                <Stack.Screen
                  name="Settings"
                  children={({ navigation, route }) => (
                    <SettingsScreen navigation={navigation} route={route} />
                  )}
                />
                <Stack.Screen
                  name="Machine"
                  component={MachineScreen}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ConfigProvider>
    </ThemeProvider>
  );
}
