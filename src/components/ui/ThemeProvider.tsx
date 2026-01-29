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
  const colorScheme = useColorScheme();
  
  // Determine if we should use dark mode
  const shouldUseDark = isDarkMode ?? (colorScheme === 'dark');
  
  // Get current theme colors
  const colors = React.useMemo(() => {
    const currentTheme = rawThemes[themePreset] || rawThemes.default;
    return currentTheme[shouldUseDark ? 'dark' : 'light'];
  }, [themePreset, shouldUseDark]);
  
  // Apply theme for web via CSS variables
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', themePreset);
      if (shouldUseDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      // Set CSS variables for web (they work there)
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-text', colors.text);
      root.style.setProperty('--color-border', colors.border);
    }
  }, [themePreset, colors, shouldUseDark]);
  
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