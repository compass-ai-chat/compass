import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CardProps {
  icon?: string;
  title: string;
  description?: string;
  status?: {
    enabled: boolean;
    label?: string;
  };
  actions?: ReactNode;
  onPress?: () => void;
  className?: string;
  children?: ReactNode;
}

export function Card({
  icon,
  title,
  description,
  status,
  actions,
  onPress,
  className = "",
  children,
}: CardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      onPress={onPress}
      className={`bg-surface rounded-lg shadow-sm border border-border overflow-hidden mb-4 ${className}`}
    >
      <View>
        <View className="flex-row items-center mb-3 bg-primary p-2">
          {icon && (
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Ionicons 
                name={icon as any} 
                size={16} 
                className="!text-white" 
              />
            </View>
          )}
          <Text className="flex-1 text-white font-medium">{title}</Text>
          {status && (
            <View className={`px-2 py-1 rounded-full ${status.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text className={`text-xs ${status.enabled ? 'text-green-800' : 'text-red-800'}`}>
                {status.label || (status.enabled ? 'Enabled' : 'Disabled')}
              </Text>
            </View>
          )}
        </View>
        
        <View className="p-4">
          {children}
          
          {description && !children && (
            <Text className="text-text text-sm mb-4" numberOfLines={2}>
              {description}
            </Text>
          )}

          {actions && (
            <View className="flex-row justify-end space-x-2">
              {actions}
            </View>
          )}
        </View>
      </View>
    </CardWrapper>
  );
} 