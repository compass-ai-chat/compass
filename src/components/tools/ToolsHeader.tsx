import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useResponsiveStyles } from "@/src/hooks/useResponsiveStyles";
import { SectionHeader } from "@/src/components/ui/SectionHeader";

interface ToolsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => Promise<void>;
  onAddTool: () => void;
  onListBlueprints: () => void;
}

export function ToolsHeader({
  searchQuery,
  setSearchQuery,
  onRefresh,
  onAddTool,
  onListBlueprints,
}: ToolsHeaderProps) {
  const { getResponsiveSize, getResponsiveClass, getResponsiveValue } = useResponsiveStyles();

  const rightContent = (
    <>
      <TouchableOpacity
        onPress={onListBlueprints}
        className="bg-primary px-3 py-2 rounded-lg flex-row items-center"
      >
        <Ionicons
          name="library"
          size={getResponsiveSize(16, 20)}
          color="white"
        />
        <Text className={`text-white ml-2 font-medium ${getResponsiveClass("text-sm", "")}`}>
          {getResponsiveValue({ mobile: "Blueprints", desktop: "Manage Blueprints" })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onAddTool}
        className="bg-primary px-3 py-2 rounded-lg flex-row items-center"
      >
        <Ionicons
          name="add"
          size={getResponsiveSize(16, 20)}
          color="white"
        />
        <Text className={`text-white ml-2 font-medium ${getResponsiveClass("text-sm", "")}`}>
          Add Tool
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <SectionHeader
        title="Tools"
        icon="construct"
        rightContent={rightContent}
      />

      <View className="flex-row mb-4">
        <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3 py-2">
          <Ionicons
            name="search"
            size={getResponsiveSize(16, 20)}
            className="!text-secondary mr-2"
          />
          <TextInput
            className={`flex-1 text-text outline-none ${getResponsiveClass("text-sm", "")}`}
            placeholder="Search tools..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={getResponsiveSize(16, 20)}
                className="!text-secondary"
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          className="ml-2 bg-surface p-2 rounded-lg"
        >
          <Ionicons
            name="refresh"
            size={getResponsiveSize(20, 24)}
            className="!text-primary"
          />
        </TouchableOpacity>
      </View>
    </>
  );
} 