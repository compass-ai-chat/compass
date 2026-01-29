import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useResponsiveStyles } from "@/src/hooks/useResponsiveStyles";
import { useThemePreset } from './ThemeProvider';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) {
  const { getResponsiveSize, getResponsiveClass } = useResponsiveStyles();
  const { theme } = useThemePreset();

  return (
    <View className={`bg-surface rounded-lg flex-row items-center p-2 ${className}`}>
      <Ionicons
        name="search"
        size={getResponsiveSize(16, 20)}
        color={theme.primary}
        className="mr-2"
      />
      <TextInput
        className={`flex-1 text-text outline-none ${getResponsiveClass("text-sm", "")}`}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity className='mr-2' onPress={() => onChangeText("")}>
          <Ionicons
            name="close-circle"
            size={getResponsiveSize(16, 20)}
            className="!text-secondary"
          />
        </TouchableOpacity>
      )}
    </View>
  );
} 