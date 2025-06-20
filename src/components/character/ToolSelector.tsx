import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

      <View>
        {tools.length === 0 ? (
          <View className="items-center justify-center p-4 bg-surface rounded-lg">
            <Text className="text-text-secondary">
              {t('characters.edit_character.no_tools_available') || "No tools available"}
            </Text>
          </View>
        ) : (
          tools.map((item) => {
            const isSelected = selectedToolIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => isSelected ? onRemoveTool(item.id) : onSelectTool(item.id)}
                className={`flex-row items-center p-3 mb-2 rounded-lg border ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <View className={`w-10 h-10 rounded-full ${isSelected ? "bg-primary" : "bg-primary/20"} items-center justify-center mr-3`}>
                  <Ionicons
                    name={item.icon as any}
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
          })
        )}
      </View>
    </View>
  );
} 