import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useResponsiveStyles } from "@/src/hooks/useResponsiveStyles";

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  rightContent?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  rightContent,
  className = "",
}: SectionHeaderProps) {
  const { getResponsiveClass, getResponsiveSize } = useResponsiveStyles();

  return (
    <View
      className={`${getResponsiveClass(
        "flex-col",
        "flex-row justify-between"
      )} items-center mb-4 ${className}`}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={icon}
          size={getResponsiveSize(24, 32)}
          className="!text-primary mr-2"
        />
        <Text
          className={`${getResponsiveClass(
            "text-xl",
            "text-2xl"
          )} font-bold text-primary`}
        >
          {title}
        </Text>
      </View>
      {rightContent && (
        <View
          className={`flex-row ${getResponsiveClass(
            "mt-2 w-full justify-between",
            "space-x-2"
          )}`}
        >
          {rightContent}
        </View>
      )}
    </View>
  );
} 