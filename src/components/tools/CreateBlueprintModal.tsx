import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Modal } from '@/src/components/ui/Modal';
import { useColorScheme } from 'nativewind';
import CodeEditor from '@/src/components/ui/CodeEditor';
import { toastService } from '@/src/services/toastService';
import { Ionicons } from "@expo/vector-icons";
import { IconSelector } from "@/src/components/character/IconSelector";
import { compileTypescript } from '@/src/utils/tsCompiler';
import { SimpleSchema } from '@/src/utils/zodHelpers';

export interface CreateToolBlueprintData {
  id: string;
  description: string;
  code: string;
  icon?: string;
  paramsSchema?: SimpleSchema;
  configSchema?: SimpleSchema;
}

interface CreateBlueprintModalProps {
  isVisible: boolean;
  onClose: () => void;
  isLoading: boolean;
  createToolData: CreateToolBlueprintData;
  setCreateToolBlueprintData: (data: CreateToolBlueprintData) => void;
  onCreateBlueprint: () => Promise<void>;
}

export function CreateBlueprintModal({
  isVisible,
  onClose,
  isLoading,
  createToolData,
  setCreateToolBlueprintData,
  onCreateBlueprint,
}: CreateBlueprintModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showIconSelector, setShowIconSelector] = useState(false);

  const handleCodeChange = (code: string) => {
    try {
      const { compiledCode, paramsSchema, configSchema } = compileTypescript(code);
      setCreateToolBlueprintData({
        ...createToolData,
        code,
        paramsSchema,
        configSchema,
      });
    } catch (error) {
      console.error('Error compiling TypeScript:', error);
    }
  };

  const handleNameChange = (text: string) => {
    let sanitizedText = text.replace(/[^a-zA-Z0-9]/g, '');
    // remove all spaces
    sanitizedText = sanitizedText.replace(/\s+/g, '');
    setCreateToolBlueprintData({...createToolData, id: sanitizedText});
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="w-[70%]"
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
              value={createToolData.id}
              onChangeText={handleNameChange}
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
            onChangeText={(text) => setCreateToolBlueprintData({...createToolData, description: text})}
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
              onChangeText={handleCodeChange}
              language="typescript"
              style={{ height: 300 }}
              textStyle={{ color: isDark ? '#f5f5f5' : '#333' }}
              className='h-full'
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
          setCreateToolBlueprintData({ ...createToolData, icon: iconName });
          setShowIconSelector(false);
        }}
        currentIcon={createToolData.icon}
      />
    </Modal>
  );
} 