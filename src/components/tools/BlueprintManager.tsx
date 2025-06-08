import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Modal } from '@/src/components/ui/Modal';
import { Ionicons } from '@expo/vector-icons';
import { useTools } from '@/src/hooks/useTools';
import { useAtom } from 'jotai';
import { toolBlueprintsAtom } from '@/src/hooks/atoms';
import { useColorScheme } from 'nativewind';
import CodeEditor from '@/src/components/ui/CodeEditor';
import { toastService } from '@/src/services/toastService';
import { DEFAULT_TOOLS } from '@/src/tools/registerTools';
import { CreateBlueprintModal } from './CreateBlueprintModal';
import { z } from 'zod';
import { CreateToolData } from './CreateBlueprintModal';
import { ToolBlueprint } from '@/src/tools/tool.interface';
import { compileTypescript } from '@/src/utils/tsCompiler';
import { hasConfigOptions } from '@/src/hooks/useTools';
import { zodSchemaToJsonSchema } from "@/src/utils/zodHelpers";

interface BlueprintManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

const defaultBlueprint = {
  name: "",
  description: "",
  code: `
// Define your function parameters and config values using TypeScript types
async function execute(params: { message: string }, configValues: { printTimes: number }) {
  let result = {success: true, message: ""}
  for (let i = 0; i < configValues.printTimes; i++) {
    result.message += params.message;
  }
  return result;
}`
};

export function BlueprintManager({ isVisible, onClose }: BlueprintManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlueprint, setSelectedBlueprint] = useState<string | null>(null);
  const [showCreateBlueprintModal, setShowCreateBlueprintModal] = useState(false);
  const [createToolData, setCreateToolData] = useState<CreateToolData>(defaultBlueprint);
  const [toolBlueprints] = useAtom(toolBlueprintsAtom);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { registerToolBlueprint, addTool } = useTools();

  // Get built-in tool types
  const builtInTools = DEFAULT_TOOLS.map(tool => tool.blueprintId);

  const handleCreateToolBlueprint = async () => {
    try {
      if (!createToolData.name || !createToolData.description || !createToolData.code) {
        toastService.warning({ title: "Please fill all required fields" });
        return;
      }

      // Compile TypeScript code and extract schemas
      const { compiledCode, paramsSchema, configSchema } = compileTypescript(createToolData.code);

      console.log("compiledCode", compiledCode);
      // Create a safe evaluation context with z
      const evalWithContext = (code: string) => {
        return new Function('z', `return ${code}`)(z);
      };

      let blueprint = await registerToolBlueprint({
        name: createToolData.name,
        description: createToolData.description,
        icon: createToolData.icon || 'code',
        code: compiledCode, // Use the compiled JavaScript code
        paramsSchema: evalWithContext(paramsSchema),
        configSchema: evalWithContext(configSchema),
      });

      console.log("new blueprint", blueprint);

      if(!hasConfigOptions(blueprint.configSchema as z.ZodSchema)){
        console.log("adding tool", blueprint);
        addTool({
          id: Date.now().toString(),
          blueprintId: blueprint.name,
          configValues: {},
          name: blueprint.name,
          description: blueprint.description,
          enabled: true,
          icon: blueprint.icon,
          paramsSchema: zodSchemaToJsonSchema(blueprint.paramsSchema),
          configSchema: zodSchemaToJsonSchema(blueprint.configSchema),
        });
      }

      setShowCreateBlueprintModal(false);
      setCreateToolData(defaultBlueprint);
      toastService.success({ title: "Blueprint created successfully" });
    } catch (error) {
      console.error('Blueprint creation error:', error);
      toastService.danger({ 
        title: "Error creating blueprint", 
        description: error instanceof Error ? error.message : "Invalid function definition" 
      });
    }
  };

  const filteredBlueprints = toolBlueprints.filter((blueprint: ToolBlueprint) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      blueprint.name.toLowerCase().includes(searchLower) ||
      blueprint.description.toLowerCase().includes(searchLower)
    );
  });

  const handleEditBlueprint = async (name: string, blueprint: ToolBlueprint) => {
    try {
      const { compiledCode, paramsSchema, configSchema } = compileTypescript(blueprint.code || '');

      await registerToolBlueprint({
        ...blueprint,
        name,
        code: compiledCode,
        paramsSchema: new Function('z', `return ${paramsSchema}`)(z),
        configSchema: new Function('z', `return ${configSchema}`)(z),
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
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setShowCreateBlueprintModal(true)}
              className="bg-primary px-3 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" className="mr-1" />
              <Text className="text-white">Create Blueprint</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full hover:bg-surface"
            >
              <Ionicons name="close" size={24} className="text-secondary" />
            </TouchableOpacity>
          </View>
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
                  .filter((blueprint: ToolBlueprint) => builtInTools.includes(blueprint.name))
                  .map((blueprint: ToolBlueprint) => (
                    <View
                      key={blueprint.name}
                      className="bg-surface p-4 rounded-lg border border-border"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={(blueprint.icon as any) || 'cube-outline'}
                            size={24}
                            className="text-primary mr-2"
                          />
                          <View>
                            <Text className="text-lg font-medium text-text">{blueprint.name}</Text>
                            <Text className="text-secondary">{blueprint.description}</Text>
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
                  .filter((blueprint: ToolBlueprint) => !builtInTools.includes(blueprint.name))
                  .map((blueprint: ToolBlueprint) => (
                    <View
                      key={blueprint.name}
                      className="bg-surface p-4 rounded-lg border border-border"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={(blueprint.icon as any) || 'code-outline'}
                            size={24}
                            className="text-primary mr-2"
                          />
                          <View>
                            <Text className="text-lg font-medium text-text">{blueprint.name}</Text>
                            <Text className="text-secondary">{blueprint.description}</Text>
                          </View>
                        </View>
                        <View className="flex-row space-x-2">
                          <TouchableOpacity
                            onPress={() => selectedBlueprint === blueprint.name ? setSelectedBlueprint(null) : setSelectedBlueprint(blueprint.name)}
                            className="bg-primary px-3 py-1 rounded-lg"
                          >
                            <Text className="text-white">Edit</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {selectedBlueprint === blueprint.name && (
                        <View className="mt-4">
                          <View className="border border-primary rounded-lg overflow-hidden h-full">
                            <CodeEditor
                              value={blueprint.code || ''}
                              onChangeText={(code: string) =>
                                handleEditBlueprint(blueprint.name, { ...blueprint, code })
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

        <CreateBlueprintModal
          isVisible={showCreateBlueprintModal}
          onClose={() => setShowCreateBlueprintModal(false)}
          isLoading={false}
          createToolData={createToolData}
          setCreateToolData={setCreateToolData}
          onCreateBlueprint={handleCreateToolBlueprint}
        />
      </View>
    </Modal>
  );
} 