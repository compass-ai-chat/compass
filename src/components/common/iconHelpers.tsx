import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Ionicons from "@expo/vector-icons/Ionicons";
import { FontAwesome6 } from "@expo/vector-icons";

/**
 * Helper function to render icon components based on icon name
 * Supports both Ionicons and FontAwesome6 icons
 */
export function IconComponent({iconName, className, size = 20}: {iconName: string, className: string, size: number}) {
  const ioniconsNames = Object.keys(Ionicons.glyphMap);
  
  if (ioniconsNames.includes(iconName)) {
    return (<Ionicons name={iconName as any} size={size} className={className} />);
  }

  // Convert for FontAwesome
  const faName = iconName
    .replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
    .replace("-outline", "")
    .replace("-sharp", "");

  return (<FontAwesome6 name={faName as any} size={size} className={className} />);
};

