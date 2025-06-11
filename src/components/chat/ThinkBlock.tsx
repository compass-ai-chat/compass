import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Platform } from 'react-native';

interface ThinkBlockProps {
  content: string;
  isDark: boolean;
  style: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ThinkBlock: React.FC<ThinkBlockProps> = ({ 
  content, 
  isDark, 
  style, 
  isExpanded, 
  onToggleExpand 
}) => {
  return (
    <View style={style} className="border-border border">
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={onToggleExpand}
          className="mr-2 p-1 flex-row items-center"
        >
          <Ionicons 
            name={isExpanded ? "chevron-down" : "chevron-forward"} 
            size={16} 
            color={isDark ? "#fff" : "#000"}
          />
          <View className="flex-row items-center">
            <Ionicons 
              name="bulb" 
              size={16} 
              className={`!text-primary mr-2 ${Platform.OS === 'web' ? 'animate-pulse' : ''}`}
            />
            <Text className="pl-2 text-md pt-1 text-text opacity-50">Thinking process</Text>
          </View>
        </TouchableOpacity>
      </View>
      {isExpanded && (
        <View className="p-4 bg-surface/30">
          <Text className="text-text">{content}</Text>
        </View>
      )}
    </View>
  );
}; 