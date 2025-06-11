import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Switch } from "react-native";
import { Modal } from "@/src/components/ui/Modal";
import CodeEditor from "@/src/components/ui/CodeEditor";
import { Tool, UpdateToolDto } from "@/src/types/tools";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { IconSelector } from "@/src/components/character/IconSelector";
import { ToolBlueprint } from "@/src/tools/tool.interface";

interface EditToolModalProps {
  isVisible: boolean;
  onClose: () => void;
  isLoading: boolean;
  selectedTool: Tool | null;
  formData: UpdateToolDto;
  setFormData: (data: UpdateToolDto) => void;
  onUpdateTool: () => Promise<void>;
  toolBlueprint: ToolBlueprint;
}

export function EditToolModal({
  isVisible,
  onClose,
  isLoading,
  selectedTool,
  formData,
  setFormData,
  onUpdateTool,
  toolBlueprint,
}: EditToolModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedBlueprint, setSelectedBlueprint] = useState<ToolBlueprint | null>(null);

  if (!selectedTool) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="w-2/3"
    >
      <View className="space-y-4 p-4">
        <Text className="text-xl font-bold text-primary">Edit Tool</Text>
        
        <View className="flex-row items-start space-x-4">
          <View className="flex-1">
            <Text className="text-secondary mb-1">Name *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
              placeholder="Tool name"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />
          </View>
          
        </View>
        
        <View>
          <Text className="text-secondary mb-1">Description *</Text>
          <TextInput
            className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
            placeholder="Tool description"
            placeholderTextColor="#9CA3AF"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        <View>
          <Text className="text-secondary mb-1">Type *</Text>
          <View className="border border-border rounded-lg p-2 bg-surface">
            {toolBlueprint ? (
              <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    key={toolBlueprint.id}
                    onPress={() => {
                      setFormData({
                        ...formData, 
                        blueprintId: toolBlueprint.id,
                        configValues: {},
                        paramsSchema: toolBlueprint.paramsSchema,
                        configSchema: toolBlueprint.configSchema,
                      });
                    }}
                    className={`flex-row items-center px-3 py-2 rounded-lg ${formData.blueprintId === toolBlueprint.id ? 'bg-primary' : 'bg-primary/10'}`}
                  >
                    <Ionicons
                      name={toolBlueprint.icon as any}
                      size={20}
                      color={formData.blueprintId === toolBlueprint.id ? 'white' : '#6366F1'}
                      className="mr-2"
                    />
                    <Text className={`${formData.blueprintId === toolBlueprint.id ? 'text-white' : 'text-primary'}`}>
                      {toolBlueprint.id}
                    </Text>
                  </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                className="text-text"
                placeholder="Tool type"
                value={formData.blueprintId}
                onChangeText={(text) => setFormData({...formData, blueprintId: text})}
              />
            )}
          </View>
        </View>
        
        {formData.blueprintId && formData.configSchema && (
          <View>
            <Text className="text-secondary mb-1">Configuration</Text>
            <View className="border border-border rounded-lg bg-surface p-3 space-y-3">
              {Object.keys(formData.configSchema || {}).slice(0, 5).map((key) => {
                const fieldConfig = typeof formData.configSchema?.[key as keyof typeof formData.configSchema] === 'object' ? formData.configSchema?.[key as keyof typeof formData.configSchema] : { type: 'string' };
                const description = fieldConfig.description || '';
                const isSecret = fieldConfig.type === 'password' || 
                                key.toLowerCase().includes('secret') || 
                                key.toLowerCase().includes('token');
                
                return (
                  <View key={key}>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-secondary">{key}</Text>
                      {description && (
                        <Text className="text-xs text-secondary/70 italic">{description}</Text>
                      )}
                    </View>
                    <TextInput
                      className="border border-border rounded-lg p-2 bg-surface text-text"
                      placeholder={`Enter ${key}`}
                      value={typeof (formData.configValues || {})[key] === 'string' ? (formData.configValues || {})[key] : ''}
                      onChangeText={(text) => setFormData({
                        ...formData, 
                        configValues: {
                          ...(formData.configValues || {}),
                          [key]: text
                        }
                      })}
                      secureTextEntry={isSecret}
                    />
                  </View>
                );
              })}
              
              {Object.keys(formData.configSchema || {}).length === 0 && (
                <Text className="text-secondary italic p-2">No configuration fields available</Text>
              )}
            </View>
          </View>
        )}
        
        <View className="flex-row items-center justify-between">
          <Text className="text-secondary">Enabled</Text>
          <Switch
            value={formData.enabled}
            onValueChange={(value) => setFormData({...formData, enabled: value})}
          />
        </View>
        
        <View className="flex-row justify-end space-x-2 mt-4">
          <TouchableOpacity
            onPress={onClose}
            className="bg-surface border border-border px-4 py-2 rounded-lg"
          >
            <Text className="text-text">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onUpdateTool}
            className="bg-primary px-4 py-2 rounded-lg"
            disabled={isLoading}
          >
            <Text className="text-white">Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>

    </Modal>
  );
} 