import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

  const handleTestTool = (tool: Tool) => {
    setSelectedTool(tool);
    setShowTestModal(true);
  };

  return (
    <View className="bg-surface rounded-lg overflow-hidden">
      <View className="flex-row bg-primary/10 p-3">
        <Text className="font-medium text-primary w-10"></Text>
        <Text className="font-medium text-primary flex-1">Name</Text>
        <Text className="font-medium text-primary flex-1">Description</Text>
        <Text className="font-medium text-primary w-24 text-center">Type</Text>
        <Text className="font-medium text-primary w-20 text-center">Status</Text>
        <Text className="font-medium text-primary w-32 text-center">Actions</Text>
      </View>
      
      {tools.length === 0 ? (
        <View className="p-4 items-center">
          <Text className="text-secondary">No tools found</Text>
        </View>
      ) : (
        tools.map((tool, index) => (
          <View 
            key={tool.id} 
            className={`flex-row items-center p-3 border-b border-border ${index % 2 === 1 ? 'bg-surface/50' : ''}`}
          >
            <View className="w-10 items-center justify-center">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                <Ionicons 
                  name={tool.icon as any} 
                  size={16} 
                  className="!text-primary" 
                />
              </View>
            </View>
            <Text className="flex-1 text-text font-medium">{tool.name}</Text>
            <Text className="flex-1 text-text text-sm" numberOfLines={2}>{tool.description}</Text>
            <View className="w-24 items-center">
              <View className="px-2 py-1 rounded-full bg-blue-100">
                <Text className="text-xs text-blue-800">
                  {tool.type}
                </Text>
              </View>
            </View>
            <View className="w-20 items-center">
              <View className={`px-2 py-1 rounded-full ${tool.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`text-xs ${tool.enabled ? 'text-green-800' : 'text-red-800'}`}>
                  {tool.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <View className="w-32 flex-row justify-center space-x-1">
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
        ))
      )}

      <TestToolModal
        isVisible={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setSelectedTool(null);
        }}
        tool={selectedTool}
      />
    </View>
  );
} 