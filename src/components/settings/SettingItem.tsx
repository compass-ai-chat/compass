import React, { ComponentProps } from 'react';
import { View, TouchableOpacity, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface SettingItemProps {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  className?: string;
}

export const SettingItem = ({
  title,
  description,
  icon,
  onPress,
  className,
}: SettingItemProps) => (
  <TouchableOpacity
    className={`flex-row items-center h-32 p-4 mb-2 bg-surface rounded-lg border border-border hover:bg-background hover:shadow-md ${className}`}
    onPress={onPress}
  >
    <View className="bg-primary/10 p-3 rounded-full mr-4">
      <Ionicons name={icon} size={24} className="!text-primary" />
    </View>
    <View className="flex-1">
      <Text className="text-lg font-semibold text-text mb-1">{title}</Text>
      <Text className="text-secondary text-sm">{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} className="!text-secondary" />
  </TouchableOpacity>
);
