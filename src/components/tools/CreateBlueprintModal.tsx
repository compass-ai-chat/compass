import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Modal } from '@/src/components/ui/Modal';
import { useColorScheme } from 'nativewind';
import CodeEditor from '@/src/components/ui/CodeEditor';
import { toastService } from '@/src/services/toastService';
import { Ionicons } from "@expo/vector-icons";
import { IconSelector } from "@/src/components/character/IconSelector";

export interface CreateToolData {
  name: string;
  description: string;
  code: string;
  icon?: string;
  paramsSchema?: string;
  configSchema?: string;
}

interface CreateBlueprintModalProps {
  isVisible: boolean;
  onClose: () => void;
  isLoading: boolean;
  createToolData: CreateToolData;
  setCreateToolData: (data: CreateToolData) => void;
  onCreateBlueprint: () => Promise<void>;
  extractSchemas: (code: string) => { paramsSchema: string; configSchema: string };
}

export function CreateBlueprintModal({
  isVisible,
  onClose,
  isLoading,
  createToolData,
  setCreateToolData,
  onCreateBlueprint,
  extractSchemas,
}: CreateBlueprintModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showIconSelector, setShowIconSelector] = useState(false);

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="w-3/4"
    >
      <View className="space-y-4 p-4">
        <Text className="text-xl font-bold text-primary">Create New Blueprint</Text>
        
        <View className="flex-row items-start space-x-4">
          <View className="flex-1">
            <Text className="text-secondary mb-1">Name *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
              placeholder="Tool name"
              placeholderTextColor="#9CA3AF"
              value={createToolData.name}
              onChangeText={(text) => setCreateToolData({...createToolData, name: text})}
            />
          </View>
          
          <View className="items-center">
            <Text className="text-secondary mb-1">Icon</Text>
            <TouchableOpacity
              onPress={() => setShowIconSelector(true)}
              className="w-[60px] h-[60px] rounded-full bg-primary items-center justify-center hover:opacity-80"
            >
              <Ionicons
                name={(createToolData.icon || "construct") as any}
                size={32}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View>
          <Text className="text-secondary mb-1">Description *</Text>
          <TextInput
            className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
            placeholder="Tool description"
            placeholderTextColor="#9CA3AF"
            value={createToolData.description}
            onChangeText={(text) => setCreateToolData({...createToolData, description: text})}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        <View>
          <Text className="text-secondary mb-1">Implementation</Text>
          <View className="border border-border rounded-lg overflow-hidden">
            <CodeEditor
              value={createToolData.code}
              onChangeText={(code: string) => {
                const schemas = extractSchemas(code);
                setCreateToolData({
                  ...createToolData,
                  code,
                  paramsSchema: schemas.paramsSchema,
                  configSchema: schemas.configSchema,
                });
              }}
              language="typescript"
              style={{ height: 256 }}
              textStyle={{ color: isDark ? '#f5f5f5' : '#333' }}
            />
          </View>
        </View>
        
        <View className="flex-row justify-end space-x-2 mt-4">
          <TouchableOpacity
            onPress={onClose}
            className="bg-surface border border-border px-4 py-2 rounded-lg"
          >
            <Text className="text-text">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onCreateBlueprint}
            className="bg-primary px-4 py-2 rounded-lg"
            disabled={isLoading}
          >
            <Text className="text-white">Create Blueprint</Text>
          </TouchableOpacity>
        </View>
      </View>

      <IconSelector
        isVisible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(iconName) => {
          setCreateToolData({ ...createToolData, icon: iconName });
          setShowIconSelector(false);
        }}
        currentIcon={createToolData.icon}
      />
    </Modal>
  );
} 