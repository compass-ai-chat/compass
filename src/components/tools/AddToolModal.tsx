import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Switch } from "react-native";
import { Modal } from "@/src/components/ui/Modal";
import CodeEditor from "@/src/components/ui/CodeEditor";
import { CreateToolDto } from "@/src/types/tools";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { ToolBlueprint } from "@/src/tools/tool.interface";

interface AddToolModalProps {
  isVisible: boolean;
  onClose: () => void;
  isLoading: boolean;
  formData: CreateToolDto;
  setFormData: (data: CreateToolDto) => void;
  onAddTool: () => Promise<void>;
  toolBlueprints: ToolBlueprint[];
  showCodeEditor: boolean;
  setShowCodeEditor: (show: boolean) => void;
  defaultCodeTemplate: string;
}

export function AddToolModal({
  isVisible,
  onClose,
  isLoading,
  formData,
  setFormData,
  onAddTool,
  toolBlueprints,
  showCodeEditor,
  setShowCodeEditor,
  defaultCodeTemplate,
}: AddToolModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showIconSelector, setShowIconSelector] = useState(false);

  const [selectedBlueprint, setSelectedBlueprint] = useState<ToolBlueprint | null>(null);
  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="w-2/3"
    >
      <View className="space-y-4 p-4">
        <Text className="text-xl font-bold text-primary">Add New Tool</Text>
        
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
            {toolBlueprints.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {toolBlueprints.map((blueprint) => (
                  <TouchableOpacity
                    key={blueprint.name}
                    onPress={() => {
                      setSelectedBlueprint(blueprint);
                      setFormData({
                        ...formData, 
                        type: blueprint.name,
                        configValues: {},
                        paramsSchema: blueprint.paramsSchema,
                        configSchema: blueprint.configSchema,
                      });
                    }}
                    className={`flex-row items-center px-3 py-2 rounded-lg ${formData.type === blueprint.name ? 'bg-primary' : 'bg-primary/10'}`}
                  >
                    <Ionicons
                      name={blueprint.icon as any}
                      size={20}
                      color={formData.type === blueprint.name ? 'white' : '#6366F1'}
                      className="mr-2"
                    />
                    <Text className={`${formData.type === blueprint.name ? 'text-white' : 'text-primary'}`}>
                      {blueprint.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                className="text-text"
                placeholder="Tool type"
                value={formData.type}
                onChangeText={(text) => setFormData({...formData, type: text})}
              />
            )}
          </View>
        </View>
        
        {formData.type && toolBlueprints.find((blueprint) => blueprint.name === formData.type)?.configSchema && (
          <View>
            <Text className="text-secondary mb-1">Configuration</Text>
            <View className="border border-border rounded-lg bg-surface p-3 space-y-3">
              {Object.keys(selectedBlueprint?.configSchema || {}).slice(0, 5).map((key) => {
                const schema = selectedBlueprint?.configSchema;
                const fieldConfig = typeof schema?.[key as keyof typeof schema] === 'object' ? schema?.[key as keyof typeof schema] : { type: 'string' };
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
              
              {Object.keys(toolBlueprints.find((blueprint) => blueprint.name === formData.type)?.configSchema || {}).length === 0 && (
                <Text className="text-secondary italic p-2">No configuration fields available</Text>
              )}
            </View>
          </View>
        )}
        
        {formData.type && (
          <View>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-secondary">Implementation</Text>
              <TouchableOpacity
                onPress={() => setShowCodeEditor(!showCodeEditor)}
                className="flex-row items-center"
              >
                <Text className="text-primary mr-2">
                  {showCodeEditor ? 'Hide Code' : 'Show Code'}
                </Text>
                <Ionicons
                  name={showCodeEditor ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  className="!text-primary"
                />
              </TouchableOpacity>
            </View>

            {showCodeEditor && (
              <View className="border border-border rounded-lg overflow-hidden">
                <CodeEditor
                  value={formData.code || defaultCodeTemplate}
                  onChangeText={(code: string) => setFormData({ ...formData, code })}
                  language="typescript"
                  style={{ height: 256 }}
                  textStyle={{ color: isDark ? '#f5f5f5' : '#333' }}
                />
              </View>
            )}
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
            onPress={onAddTool}
            className="bg-primary px-4 py-2 rounded-lg"
            disabled={isLoading}
          >
            <Text className="text-white">Add Tool</Text>
          </TouchableOpacity>
        </View>
      </View>

    </Modal>
  );
} 