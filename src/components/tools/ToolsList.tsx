import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tool } from "@/src/types/tools";
import { TestToolModal } from "./TestToolModal";

interface ToolsListProps {
  tools: Tool[];
  onEditTool: (tool: Tool) => void;
  onDeleteTool: (tool: Tool) => void;
}

export function ToolsList({ tools, onEditTool, onDeleteTool }: ToolsListProps) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleTestTool = (tool: Tool) => {
    setSelectedTool(tool);
    setShowTestModal(true);
  };

  if (tools.length === 0) {
    return (
      <View className="p-4 items-center">
        <Text className="text-secondary">No tools found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <View className="md:gap-4 gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <View 
              key={tool.id}
              className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden mb-4"
            >
              <View className="">
                <View className="flex-row items-center mb-3 bg-primary p-2">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Ionicons 
                      name={tool.icon as any} 
                      size={16} 
                      className="!text-white" 
                    />
                  </View>
                  <Text className="flex-1 text-white font-medium">{tool.name}</Text>
                  <View className={`px-2 py-1 rounded-full ${tool.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-xs ${tool.enabled ? 'text-green-800' : 'text-red-800'}`}>
                      {tool.enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                
                <View className="p-4">
                <Text className="text-text text-sm mb-4" numberOfLines={2}>
                  {tool.description}
                </Text>

                <View className="flex-row justify-end space-x-2">
                  <TouchableOpacity 
                    onPress={() => handleTestTool(tool)}
                    className="p-2 bg-blue-100 rounded-lg"
                  >
                    <Ionicons name="play" size={16} className="!text-blue-800" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => onEditTool(tool)}
                    className="p-2 bg-primary/10 rounded-lg"
                  >
                    <Ionicons name="pencil" size={16} className="!text-primary" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => onDeleteTool(tool)}
                    className="p-2 bg-red-100 rounded-lg"
                  >
                    <Ionicons name="trash" size={16} className="!text-red-800" />
                  </TouchableOpacity>
                </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TestToolModal
        isVisible={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setSelectedTool(null);
        }}
        tool={selectedTool}
      />
    </ScrollView>
  );
} 