import { PropsWithChildren, useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
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
  
  // Create style object with CSS variables for the current theme
  const themeVars = React.useMemo(() => {
    const currentTheme = rawThemes[themePreset] || rawThemes.default;
    const colors = currentTheme[shouldUseDark ? 'dark' : 'light'];
    
    return {
      '--color-primary': colors.primary,
      '--color-secondary': colors.secondary,
      '--color-background': colors.background,
      '--color-surface': colors.surface,
      '--color-text': colors.text,
      '--color-border': colors.border,
    };
  }, [themePreset, shouldUseDark]);
  
  return (
    <View style={themeVars} className="flex-1">
      <View className={`flex-1 ${shouldUseDark ? 'dark' : ''}`}>
        {children}
      </View>
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