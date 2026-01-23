import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  // Theme mode settings
  darkModeEnabled: boolean;
  automaticEnabled: boolean;
  followSystemEnabled: boolean;
  currentTheme: ThemeMode;
  
  // Effective theme (computed)
  effectiveTheme: EffectiveTheme;
  
  // Setters
  setDarkModeEnabled: (value: boolean) => void;
  setAutomaticEnabled: (value: boolean) => void;
  setFollowSystemEnabled: (value: boolean) => void;
  setCurrentTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_settings';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [automaticEnabled, setAutomaticEnabled] = useState(false);
  const [followSystemEnabled, setFollowSystemEnabled] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load theme settings from storage
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
          const settings = JSON.parse(saved);
          setDarkModeEnabled(settings.darkModeEnabled || false);
          setAutomaticEnabled(settings.automaticEnabled || false);
          setFollowSystemEnabled(settings.followSystemEnabled || false);
          setCurrentTheme(settings.currentTheme || 'light');
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      }
    };
    loadThemeSettings();
  }, []);

  // Save theme settings to storage
  useEffect(() => {
    const saveThemeSettings = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
          darkModeEnabled,
          automaticEnabled,
          followSystemEnabled,
          currentTheme,
        }));
      } catch (error) {
        console.error('Failed to save theme settings:', error);
      }
    };
    saveThemeSettings();
  }, [darkModeEnabled, automaticEnabled, followSystemEnabled, currentTheme]);

  // Update time for automatic mode
  useEffect(() => {
    if (automaticEnabled && currentTheme === 'auto') {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [automaticEnabled, currentTheme]);

  // Calculate effective theme
  const getEffectiveTheme = (): EffectiveTheme => {
    if (currentTheme === 'system' && followSystemEnabled) {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    } else if (currentTheme === 'auto' && automaticEnabled) {
      // Automatic mode: dark mode from 18:00 to 6:00
      const hour = currentTime.getHours();
      return hour >= 18 || hour < 6 ? 'dark' : 'light';
    } else if (currentTheme === 'dark' && darkModeEnabled) {
      return 'dark';
    }
    return 'light';
  };

  const effectiveTheme = getEffectiveTheme();

  // Handle theme mode changes
  const handleSetDarkModeEnabled = (value: boolean) => {
    if (value) {
      setDarkModeEnabled(true);
      setAutomaticEnabled(false);
      setFollowSystemEnabled(false);
      setCurrentTheme('dark');
    } else {
      setDarkModeEnabled(false);
      setCurrentTheme('light');
    }
  };

  const handleSetAutomaticEnabled = (value: boolean) => {
    if (value) {
      setAutomaticEnabled(true);
      setDarkModeEnabled(false);
      setFollowSystemEnabled(false);
      setCurrentTheme('auto');
    } else {
      setAutomaticEnabled(false);
      setCurrentTheme('light');
    }
  };

  const handleSetFollowSystemEnabled = (value: boolean) => {
    if (value) {
      setFollowSystemEnabled(true);
      setDarkModeEnabled(false);
      setAutomaticEnabled(false);
      setCurrentTheme('system');
    } else {
      setFollowSystemEnabled(false);
      setCurrentTheme('light');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        darkModeEnabled,
        automaticEnabled,
        followSystemEnabled,
        currentTheme,
        effectiveTheme,
        setDarkModeEnabled: handleSetDarkModeEnabled,
        setAutomaticEnabled: handleSetAutomaticEnabled,
        setFollowSystemEnabled: handleSetFollowSystemEnabled,
        setCurrentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
