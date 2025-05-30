import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tool } from "@/src/types/tools";
import { useLocalization } from "@/src/hooks/useLocalization";

interface ToolSelectorProps {
  tools: Tool[];
  selectedToolIds: string[];
  onSelectTool: (toolId: string) => void;
  onRemoveTool: (toolId: string) => void;
}

export function ToolSelector({
  tools,
  selectedToolIds,
  onSelectTool,
  onRemoveTool,
}: ToolSelectorProps) {
  const { t } = useLocalization();

  // Map tool types to appropriate Ionicons
  const getIconForToolType = (type: string): string => {
    const iconMap: Record<string, string> = {
      email: "mail-outline",
      search: "search-outline",
      weather: "cloudy-outline",
      calendar: "calendar-outline",
      calculator: "calculator-outline",
      browser: "globe-outline",
      code: "code-slash-outline",
      database: "server-outline",
      file: "document-outline",
      image: "image-outline",
      note: "pencil-outline",
      // Add more mappings as needed
    };

    return iconMap[type.toLowerCase()] || "construct-outline"; // Default to a generic tool icon
  };

  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Ionicons name="construct" size={24} className="!text-primary mr-2" />
        <Text className="text-base font-medium text-text">
          {t('characters.edit_character.tools') || "Tools"}
        </Text>
      </View>

      <FlatList
        data={tools}
        keyExtractor={(item) => item.id}
        horizontal={false}
        renderItem={({ item }) => {
          const isSelected = selectedToolIds.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => isSelected ? onRemoveTool(item.id) : onSelectTool(item.id)}
              className={`flex-row items-center p-3 mb-2 rounded-lg border ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
            >
              <View className={`w-10 h-10 rounded-full ${isSelected ? "bg-primary" : "bg-primary/20"} items-center justify-center mr-3`}>
                <Ionicons
                  name={getIconForToolType(item.type) as any}
                  size={20}
                  className={`${isSelected ? "!text-white" : "!text-text"}`}
                />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-text">{item.name}</Text>
                <Text className="text-sm text-text" numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                size={24}
                className={`ml-2 ${isSelected ? "!text-primary" : "!text-text"}`}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center p-4 bg-surface rounded-lg">
            <Text className="text-text-secondary">
              {t('characters.edit_character.no_tools_available') || "No tools available"}
            </Text>
          </View>
        }
      />
    </View>
  );
} 