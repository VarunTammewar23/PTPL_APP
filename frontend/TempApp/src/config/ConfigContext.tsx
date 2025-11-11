// src/config/ConfigContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_KEY = '@recipeApp:api_base';
const DEFAULT_API_BASE = 'http://192.168.1.42:5000'; // change to a sensible app default or blank

type ConfigContextType = {
  apiBase: string;
  setApiBase: (url: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// in-memory cache so other sync modules can read quickly
let currentApiBase: string = DEFAULT_API_BASE;
export const getCurrentApiBase = () => currentApiBase;

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [apiBase, setApiBaseState] = useState<string>(DEFAULT_API_BASE);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(API_BASE_KEY);
        if (saved) {
          setApiBaseState(saved);
          currentApiBase = saved;
        } else {
          // no saved value: keep default, but persist it so users see something
          await AsyncStorage.setItem(API_BASE_KEY, DEFAULT_API_BASE);
        }
      } catch (e) {
        console.warn('Failed to load api base', e);
      }
    })();
  }, []);

  const setApiBase = async (url: string) => {
    try {
      await AsyncStorage.setItem(API_BASE_KEY, url);
      setApiBaseState(url);
      currentApiBase = url;
    } catch (e) {
      console.warn('Failed to save api base', e);
      throw e;
    }
  };

  const resetToDefault = async () => {
    await setApiBase(DEFAULT_API_BASE);
  };

  return (
    <ConfigContext.Provider value={{ apiBase, setApiBase, resetToDefault }}>
      {children}
    </ConfigContext.Provider>
  );
};
