import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ToolsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => Promise<void>;
  onAddTool: () => void;
  onCreateBlueprint: () => void;
  onListBlueprints: () => void;
}

export function ToolsHeader({
  searchQuery,
  setSearchQuery,
  onRefresh,
  onAddTool,
  onCreateBlueprint,
  onListBlueprints,
}: ToolsHeaderProps) {
  return (
    <>
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="construct" size={32} className="!text-primary mr-2" />
          <Text className="text-2xl font-bold text-primary">Tools</Text>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={onListBlueprints}
            className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">List Blueprints</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCreateBlueprint}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="code" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Create Blueprint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAddTool}
            className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Add Tool</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row mb-4">
        <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3 py-2">
          <Ionicons name="search" size={20} className="!text-secondary mr-2" />
          <TextInput
            className="flex-1 text-text outline-none"
            placeholder="Search tools..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} className="!text-secondary" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          className="ml-2 bg-surface p-2 rounded-lg"
        >
          <Ionicons name="refresh" size={24} className="!text-primary" />
        </TouchableOpacity>
      </View>
    </>
  );
} 