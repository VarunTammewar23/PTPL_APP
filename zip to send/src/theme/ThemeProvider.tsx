// src/theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeName = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const THEME_KEY = '@recipeApp:theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const system = Appearance.getColorScheme() as ColorSchemeName;
  const [theme, setThemeState] = useState<ThemeName>((system as ThemeName) || 'light');

  useEffect(() => {
    // load persisted theme
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        }
      } catch (e) {
        console.warn('failed to load theme', e);
      }
    })();
  }, []);

  const setTheme = async (t: ThemeName) => {
    try {
      setThemeState(t);
      await AsyncStorage.setItem(THEME_KEY, t);
    } catch (e) {
      console.warn('failed to save theme', e);
    }
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
