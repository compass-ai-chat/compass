import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "@/src/utils/platform";

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
  return (
    <>
      <View className={`${Platform.isMobile ? 'flex-col' : 'flex-row justify-between'} items-center mb-4`}>
        <View className="flex-row items-center">
          <Ionicons 
            name="construct" 
            size={Platform.isMobile ? 24 : 32} 
            className="!text-primary mr-2" 
          />
          <Text className={`${Platform.isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary`}>
            Tools
          </Text>
        </View>
        <View className={`flex-row ${Platform.isMobile ? 'mt-2 w-full justify-between' : 'space-x-2'}`}>
          <TouchableOpacity
            onPress={onListBlueprints}
            className="bg-primary px-3 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons 
              name="library" 
              size={Platform.isMobile ? 16 : 20} 
              color="white" 
            />
            <Text className={`text-white ml-2 font-medium ${Platform.isMobile ? 'text-sm' : ''}`}>
              {Platform.isMobile ? 'Blueprints' : 'Manage Blueprints'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAddTool}
            className="bg-primary px-3 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons 
              name="add" 
              size={Platform.isMobile ? 16 : 20} 
              color="white" 
            />
            <Text className={`text-white ml-2 font-medium ${Platform.isMobile ? 'text-sm' : ''}`}>
              Add Tool
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row mb-4">
        <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3 py-2">
          <Ionicons 
            name="search" 
            size={Platform.isMobile ? 16 : 20} 
            className="!text-secondary mr-2" 
          />
          <TextInput
            className={`flex-1 text-text outline-none ${Platform.isMobile ? 'text-sm' : ''}`}
            placeholder="Search tools..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons 
                name="close-circle" 
                size={Platform.isMobile ? 16 : 20} 
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
            size={Platform.isMobile ? 20 : 24} 
            className="!text-primary" 
          />
        </TouchableOpacity>
      </View>
    </>
  );
} 