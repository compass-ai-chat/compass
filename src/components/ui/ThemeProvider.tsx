import { PropsWithChildren, useEffect } from 'react';
import { View, useColorScheme, Platform } from 'react-native';
import { rawThemes } from '@/constants/themes';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ThemePresetRaw } from '@/constants/themes';
import React from 'react';
import { isDarkModeAtom } from '@/src/hooks/atoms';

const themePresetAtom = atomWithStorage<ThemePresetRaw>('theme-preset', 'default');

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreset] = useAtom(themePresetAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const systemColorScheme = useColorScheme();
  
  // Determine if we should use dark mode
  const shouldUseDark = isDarkMode ?? (systemColorScheme === 'dark');
  
  // Get current theme colors for web CSS variables
  const colors = React.useMemo(() => {
    const currentTheme = rawThemes[themePreset] || rawThemes.default;
    return currentTheme[shouldUseDark ? 'dark' : 'light'];
  }, [themePreset, shouldUseDark]);
  
  // Apply theme for web only - use CSS variables on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', themePreset);
      
      // Apply dark class
      if (shouldUseDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Set CSS variables for web (these allow dynamic theme switching on web)
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-text', colors.text);
      root.style.setProperty('--color-border', colors.border);
    }
  }, [themePreset, shouldUseDark, colors]);
  
  // On native, NativeWind uses the dark: variants from tailwind.config.js
  // The dark className triggers those variants
  return (
    <View className={`flex-1 ${shouldUseDark ? 'dark' : ''}`}>
      {children}
    </View>
  );
}

export function useThemePreset() {
  const [themePreset, setThemePreset] = useAtom(themePresetAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);

  const theme = React.useMemo(() => {
    if (!rawThemes[themePreset]) {
      return rawThemes['default'][isDarkMode ? 'dark' : 'light'];
    }
    return rawThemes[themePreset][isDarkMode ? 'dark' : 'light'];
  }, [themePreset, isDarkMode]);
    
  return {
    themePreset,
    setThemePreset,
    availableThemes: Object.keys(rawThemes) as ThemePresetRaw[],
    theme
  };
}