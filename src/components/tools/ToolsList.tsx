import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tool } from "@/src/types/tools";
import { TestToolModal } from "./TestToolModal";
import { Card } from "@/src/components/ui/Card";

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

  const renderToolActions = (tool: Tool) => (
    <>
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
    </>
  );

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <View className="md:gap-4 gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              icon={tool.icon}
              title={tool.name}
              description={tool.description}
              status={{ enabled: tool.enabled }}
              actions={renderToolActions(tool)}
            />
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