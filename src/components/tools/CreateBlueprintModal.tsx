import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Modal } from '@/src/components/ui/Modal';
import { useColorScheme } from 'nativewind';
import CodeEditor from '@/src/components/ui/CodeEditor';
import { toastService } from '@/src/services/toastService';

interface CreateBlueprintModalProps {
  isVisible: boolean;
  onClose: () => void;
  isLoading: boolean;
  createToolData: {
    name: string;
    description: string;
    code: string;
  };
  setCreateToolData: (data: any) => void;
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

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="w-3/4"
    >
      <View className="space-y-4 p-4">
        <Text className="text-xl font-bold text-primary">Create New Blueprint</Text>
        
        <View>
          <Text className="text-secondary mb-1">Name *</Text>
          <TextInput
            className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
            placeholder="Tool name"
            placeholderTextColor="#9CA3AF"
            value={createToolData.name}
            onChangeText={(text) => setCreateToolData({...createToolData, name: text})}
          />
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
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-secondary">Implementation Code *</Text>
            <TouchableOpacity
              onPress={() => {
                const { paramsSchema, configSchema } = extractSchemas(createToolData.code);
                toastService.info({
                  title: "Inferred Schemas",
                  description: `Parameters:\n${paramsSchema}\n\nConfig:\n${configSchema}`
                });
              }}
              className="bg-primary/10 px-3 py-1 rounded-lg"
            >
              <Text className="text-primary text-sm">Preview Schemas</Text>
            </TouchableOpacity>
          </View>
          <View className="border border-border rounded-lg overflow-hidden">
            <CodeEditor
              value={createToolData.code}
              onChangeText={(code: string) => setCreateToolData({...createToolData, code})}
              language="typescript"
              style={{ height: 300 }}
              textStyle={{ color: isDark ? '#f5f5f5' : '#333' }}
              inputClassName="h-full"
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
    </Modal>
  );
} 