// App.tsx (navigation with Machine screen)
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/ui/ThemeProvider';
import { ConfigProvider } from './src/config/ConfigContext';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Central navigation type used by App and screens
export type RootStackParamList = {
  Login: undefined;
  Settings: undefined;
  Main: undefined;
  Machine: { recipeId: number; recipeName?: string; imageUri?: string };
};

const CUSTOMER_CODE_KEY = 'customer_code';
const EXIT_INTENT_KEY = 'exit_intent';
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [customerCode, setCustomerCode] = useState<string | null>(null);

  

 useEffect(() => {
  (async () => {
    try {
      const code = await AsyncStorage.getItem(CUSTOMER_CODE_KEY);
      const exitIntent = await AsyncStorage.getItem(EXIT_INTENT_KEY);

      // 🔴 If app was NOT exited properly → force logout
    if (code && exitIntent === 'true') {
      setCustomerCode(code);
      await AsyncStorage.removeItem(EXIT_INTENT_KEY); // 🔴 clear flag
    } else {
      await AsyncStorage.removeItem(CUSTOMER_CODE_KEY);
      setCustomerCode(null);
    }

      // clear exit flag after decision
    } catch (e) {
      console.warn('Startup session error', e);
    } finally {
      setLoading(false);
    }
  })();
}, []);


  const handleLogin = async (code: string) => {
    try {
      await AsyncStorage.setItem(CUSTOMER_CODE_KEY, code);
      await AsyncStorage.removeItem(EXIT_INTENT_KEY); // 🔴 important
      setCustomerCode(code);
    } catch (e) {
      console.warn('Login storage error', e);
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
                  // hide the default header for Main screen
                  children={() => <MainScreen customerCode={customerCode} />}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Settings"
                  children={({ navigation, route }) => (
                    <SettingsScreen navigation={navigation} route={route} onLogout={handleLogout} />
                  )}
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
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ConfigProvider>
    </ThemeProvider>
  );
}    