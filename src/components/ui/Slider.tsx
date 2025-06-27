import React from 'react';
import { View } from 'react-native';
import Slider  from '@react-native-community/slider';
import { useColorScheme } from 'nativewind';
import { rawThemes } from '@/constants/themes';
import { useThemePreset } from './ThemeProvider';

interface MySliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function MySlider({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className = ''
}: MySliderProps) {
  const { colorScheme } = useColorScheme();
  const { themePreset } = useThemePreset();
  const theme = rawThemes[themePreset][colorScheme ?? 'light'];

  return (
    <View className={className}>
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={'#a0a0a0'} // blue-400 : blue-500
        maximumTrackTintColor={'#a0a0a0'} // gray-700 : gray-200
        thumbTintColor={theme.primary} // blue-300 : blue-400
      />
    </View>
  );
} 