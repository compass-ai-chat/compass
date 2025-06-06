import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Modal } from '@/src/components/ui/Modal';
import { Ionicons } from '@expo/vector-icons';
import { useTools } from '@/src/hooks/useTools';
import { useAtom } from 'jotai';
import { blueprintDefinitionsAtom } from '@/src/hooks/atoms';
import { useColorScheme } from 'nativewind';
import CodeEditor from '@/src/components/ui/CodeEditor';
import { toastService } from '@/src/services/toastService';
import { DEFAULT_TOOLS } from '@/src/tools/registerTools';

interface BlueprintManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export function BlueprintManager({ isVisible, onClose }: BlueprintManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlueprint, setSelectedBlueprint] = useState<string | null>(null);
  const [blueprintDefinitions] = useAtom(blueprintDefinitionsAtom);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { registerToolBlueprint } = useTools();

  // Get built-in tool types
  const builtInTools = DEFAULT_TOOLS.map(tool => tool.type);

  const filteredBlueprints = Object.entries(blueprintDefinitions).filter(([name, definition]) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      definition.description.toLowerCase().includes(searchLower)
    );
  });

  const handleEditBlueprint = async (name: string, definition: any) => {
    try {
      await registerToolBlueprint({
        ...definition,
        name,
      });
      toastService.success({ title: 'Blueprint updated successfully' });
    } catch (error) {
      toastService.danger({
        title: 'Failed to update blueprint',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose} className="w-3/4 h-3/4">
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-primary">Blueprint Manager</Text>
          <TouchableOpacity
            onPress={onClose}
            className="p-2 rounded-full hover:bg-surface"
          >
            <Ionicons name="close" size={24} className="text-secondary" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3 py-2">
            <Ionicons name="search" size={20} className="text-secondary mr-2" />
            <TextInput
              className="flex-1 text-text"
              placeholder="Search blueprints..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} className="text-secondary" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Blueprints list */}
        <ScrollView className="flex-1">
          <View className="space-y-4">
            {/* Built-in Blueprints */}
            <View>
              <Text className="text-lg font-semibold text-primary mb-2">Built-in Blueprints</Text>
              <View className="space-y-2">
                {filteredBlueprints
                  .filter(([name]) => builtInTools.includes(name))
                  .map(([name, definition]) => (
                    <View
                      key={name}
                      className="bg-surface p-4 rounded-lg border border-border"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={(definition.icon as any) || 'cube-outline'}
                            size={24}
                            className="text-primary mr-2"
                          />
                          <View>
                            <Text className="text-lg font-medium text-text">{name}</Text>
                            <Text className="text-secondary">{definition.description}</Text>
                          </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-lg">
                          <Text className="text-primary">Built-in</Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            </View>

            {/* User-defined Blueprints */}
            <View>
              <Text className="text-lg font-semibold text-primary mb-2">User-defined Blueprints</Text>
              <View className="space-y-2">
                {filteredBlueprints
                  .filter(([name]) => !builtInTools.includes(name))
                  .map(([name, definition]) => (
                    <View
                      key={name}
                      className="bg-surface p-4 rounded-lg border border-border"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={(definition.icon as any) || 'code-outline'}
                            size={24}
                            className="text-primary mr-2"
                          />
                          <View>
                            <Text className="text-lg font-medium text-text">{name}</Text>
                            <Text className="text-secondary">{definition.description}</Text>
                          </View>
                        </View>
                        <View className="flex-row space-x-2">
                          <TouchableOpacity
                            onPress={() => selectedBlueprint === name ? setSelectedBlueprint(null) : setSelectedBlueprint(name)}
                            className="bg-primary px-3 py-1 rounded-lg"
                          >
                            <Text className="text-white">Edit</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {selectedBlueprint === name && (
                        <View className="mt-4">
                          <View className="border border-primary rounded-lg overflow-hidden h-full">
                            <CodeEditor
                              value={definition.code || ''}
                              onChangeText={(code: string) =>
                                handleEditBlueprint(name, { ...definition, code })
                              }
                              language="typescript"
                              style={{ height: 800 }}
                              textStyle={{ color: isDark ? '#f5f5f5' : '#333' }}
                              className='flex-1'
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
} 