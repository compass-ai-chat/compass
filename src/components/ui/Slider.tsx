import React from 'react';
import { View } from 'react-native';
import Slider  from '@react-native-community/slider';
import { useColorScheme } from 'nativewind';

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
  const isDark = colorScheme === 'dark';

  return (
    <View className={className}>
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={isDark ? '#60a5fa' : '#3b82f6'} // blue-400 : blue-500
        maximumTrackTintColor={isDark ? '#374151' : '#e5e7eb'} // gray-700 : gray-200
        thumbTintColor={isDark ? '#93c5fd' : '#60a5fa'} // blue-300 : blue-400
      />
    </View>
  );
} 