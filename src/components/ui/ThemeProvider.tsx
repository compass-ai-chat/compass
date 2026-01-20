import { PropsWithChildren, useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { rawThemes } from '@/constants/themes';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ThemePresetRaw } from '@/constants/themes';

const themePresetAtom = atomWithStorage<ThemePresetRaw>('theme-preset', 'default');

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreset, setThemePreset] = useAtom(themePresetAtom);
  const colorScheme = useColorScheme();

  let actualTheme = {};
  if(!rawThemes[themePreset]) {
    actualTheme = vars(rawThemes['default'][colorScheme ??'light']);
    setThemePreset('default');
  }
  else{
    actualTheme = vars(rawThemes[themePreset][colorScheme ?? 'light']);
  }

  
  
  return (
    <View style={actualTheme} className="flex-1">
      <View className={`flex-1 ${colorScheme === 'dark' ? 'dark' : ''}`}>
        {children}
      </View>
    </View>
  );
}

export function useThemePreset() {
  const [themePreset, setThemePreset] = useAtom(themePresetAtom);
  return {
    themePreset,
    setThemePreset,
    availableThemes: Object.keys(rawThemes) as ThemePresetRaw[],
  };
}