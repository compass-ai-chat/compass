import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAtom } from "jotai";
import { Ionicons } from "@expo/vector-icons";
import { toastService } from "@/src/services/toastService";
import { Tool, CreateToolDto, UpdateToolDto } from "@/src/types/tools";
import { Modal } from "@/src/components/ui/Modal";
import CodeEditor from "@/src/components/ui/CodeEditor";
import { useColorScheme } from "nativewind";
import { z } from "zod";
import { useTools } from "@/src/hooks/useTools";
import { ToolRegistry } from "@/src/tools/registry";

interface ToolsProps {
  tools: Tool[];
  toolBlueprints: Record<string, { paramsSchema: any; configSchema: any }>;
  onToolAdded: (formData: CreateToolDto) => Promise<string>;
  onToolUpdated: (toolId: string, formData: UpdateToolDto) => Promise<boolean>;
  onToolDeleted: (toolId: string) => Promise<boolean>;
  onLoadTools: () => Promise<void>;
}

export default function Tools({ tools, toolBlueprints, onToolAdded, onToolUpdated, onToolDeleted, onLoadTools }: ToolsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateBlueprintModal, setShowCreateBlueprintModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {getToolSchemas, registerToolBlueprint, getToolBlueprints} = useTools();

  const printToolBlueprints = async () => {
    const toolBlueprints = await getToolBlueprints();
    console.log(toolBlueprints);

    const toolSchemas = await getToolSchemas(tools.map(tool => tool.id));
    console.log(toolSchemas);
  }

  // Default code template
  const defaultCodeTemplate = `// Tool implementation
// Define your function parameters and config values using TypeScript types
// The schema will be automatically generated from these types

// Your implementation here
const result = {
  title: params.title,
  count: params.count || 0,
  apiKey: configValues.apiKey
};

return result;`;

  // Form states for adding/editing tool instances
  const [formData, setFormData] = useState<CreateToolDto>({
    name: "",
    description: "",
    type: "",
    enabled: true,
    code: "",
    configValues: {},
    paramsSchema: undefined,
    configSchema: undefined,
  });

  // Form states for creating new tool types
  const [createToolData, setCreateToolData] = useState<{
    name: string;
    description: string;
    code: string;
    paramsSchema: string;
    configSchema: string;
  }>({
    name: "",
    description: "",
    code: defaultCodeTemplate,
    paramsSchema: "z.object({\n  // Define your parameters here\n})",
    configSchema: "z.object({\n  // Define your configuration here\n})",
  });

  // Helper function to parse TypeScript function and extract parameter types
  const extractSchemas = (code: string): { paramsSchema: string, configSchema: string } => {
    try {
      // Define default schemas
      const defaultParamsSchema = `z.object({
        title: z.string(),
        count: z.number().optional()
      })`;
      
      const defaultConfigSchema = `z.object({
        apiKey: z.string()
      })`;

      return {
        paramsSchema: defaultParamsSchema,
        configSchema: defaultConfigSchema
      };
    } catch (error) {
      console.error('Error parsing function:', error);
      return {
        paramsSchema: 'z.object({})',
        configSchema: 'z.object({})'
      };
    }
  };

  useEffect(() => {
    onLoadTools();
  }, []);

  const handleAddTool = async () => {
    if (!formData.name || !formData.description || !formData.type) {
      toastService.warning({ title: "Please fill all required fields" });
      return;
    }

    setIsLoading(true);
    const toolId = await onToolAdded(formData);
    if (toolId) {
      setShowAddModal(false);
      resetForm();
      toastService.success({ title: "Tool created successfully" });
    }
    setIsLoading(false);
  };

  const handleUpdateTool = async () => {
    if (!selectedTool) return;

    setIsLoading(true);
    const success = await onToolUpdated(selectedTool.id, formData);
    if (success) {
      setShowEditModal(false);
      resetForm();
      toastService.success({ title: "Tool updated successfully" });
    }
    setIsLoading(false);
  };

  const handleDeleteTool = async (tool: Tool) => {
    if (confirm(`Are you sure you want to delete ${tool.name}?`)) {
      setIsLoading(true);
      const success = await onToolDeleted(tool.id);
      if (success) {
        toastService.success({ title: "Tool deleted successfully" });
      }
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      enabled: true,
      code: "",
      configValues: {},
      paramsSchema: undefined,
      configSchema: undefined,
    });
  };

  const openEditModal = (tool: Tool) => {
    setSelectedTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      type: tool.type,
      enabled: tool.enabled,
      code: tool.code || "",
      configValues: tool.configValues || {},
      paramsSchema: tool.paramsSchema,
      configSchema: tool.configSchema,
    });
    setShowEditModal(true);
  };

  const filteredTools = tools.filter(tool => {
    const searchLower = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.type.toLowerCase().includes(searchLower)
    );
  });

  const getToolTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'mail';
      case 'search':
        return 'search';
      case 'websearch':
        return 'search';
      case 'database':
        return 'server';
      case 'api':
        return 'code';
      default:
        return 'construct';
    }
  };

  const formatJson = (json: Record<string, any>) => {
    return JSON.stringify(json, null, 2);
  };

  const parseJsonSafely = (jsonString: string): Record<string, any> => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      toastService.warning({ 
        title: "Invalid JSON", 
        description: "Please check your JSON format" 
      });
      return {};
    }
  };

  const handleCreateToolBlueprint = async () => {
    try {
      if (!createToolData.name || !createToolData.description || !createToolData.code) {
        toastService.warning({ title: "Please fill all required fields" });
        return;
      }

      console.log("Creating tool blueprint", createToolData);

      // Extract schemas from the code
      const { paramsSchema, configSchema } = extractSchemas(createToolData.code);

      // Create a safe evaluation context with z
      const evalContext = { z };
      const evalWithContext = (code: string) => {
        return new Function('z', `return ${code}`)(z);
      };

      // Create the tool with the extracted schemas
      const newToolType = {
        name: createToolData.name,
        description: createToolData.description,
        type: createToolData.name.toLowerCase().replace(/\s+/g, '_'),
        enabled: true,
        code: createToolData.code,
        paramsSchema: evalWithContext(paramsSchema),
        configSchema: evalWithContext(configSchema),
      };

      await registerToolBlueprint({
        name: newToolType.name,
        description: newToolType.description,
        icon: 'code',
        code: newToolType.code,
        paramsSchema: newToolType.paramsSchema,
        configSchema: newToolType.configSchema,
      });

      //const toolId = await onToolAdded(newToolType);
      //if (toolId) {
      setShowCreateBlueprintModal(false);
      resetCreateForm();
      toastService.success({ title: "Tool type created successfully" });
      //}
    } catch (error) {
      console.error('Tool creation error:', error);
      toastService.danger({ 
        title: "Error creating tool", 
        description: error instanceof Error ? error.message : "Invalid function definition" 
      });
    }
  };

  const resetCreateForm = () => {
    setCreateToolData({
      name: "",
      description: "",
      code: defaultCodeTemplate,
      paramsSchema: "z.object({\n  // Define your parameters here\n})",
      configSchema: "z.object({\n  // Define your configuration here\n})",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons
              name="construct"
              size={32}
              className="!text-primary mr-2"
            />
            <Text className="text-2xl font-bold text-primary">Tools</Text>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => {
                printToolBlueprints();
              }}
              className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white ml-2 font-medium">List Blueprints</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                resetCreateForm();
                setShowCreateBlueprintModal(true);
              }}
              className="bg-secondary px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="code" size={20} color="white" />
              <Text className="text-white ml-2 font-medium">Create Blueprint</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setShowAddModal(true);
              }}
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
            onPress={onLoadTools}
            className="ml-2 bg-surface p-2 rounded-lg"
          >
            <Ionicons name="refresh" size={24} className="!text-primary" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-secondary">Loading tools...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1">
            <View className="bg-surface rounded-lg overflow-hidden">
              <View className="flex-row bg-primary/10 p-3">
                <Text className="font-medium text-primary w-10"></Text>
                <Text className="font-medium text-primary flex-1">Name</Text>
                <Text className="font-medium text-primary flex-1">Description</Text>
                <Text className="font-medium text-primary w-24 text-center">Type</Text>
                <Text className="font-medium text-primary w-20 text-center">Status</Text>
                <Text className="font-medium text-primary w-24 text-center">Actions</Text>
              </View>
              
              {filteredTools.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="text-secondary">No tools found</Text>
                </View>
              ) : (
                filteredTools.map((tool, index) => (
                  <View 
                    key={tool.id} 
                    className={`flex-row items-center p-3 border-b border-border ${index % 2 === 1 ? 'bg-surface/50' : ''}`}
                  >
                    <View className="w-10 items-center justify-center">
                      <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                        <Ionicons 
                          name={getToolTypeIcon(tool.type)} 
                          size={16} 
                          className="!text-primary" 
                        />
                      </View>
                    </View>
                    <Text className="flex-1 text-text font-medium">{tool.name}</Text>
                    <Text className="flex-1 text-text text-sm" numberOfLines={2}>{tool.description}</Text>
                    <View className="w-24 items-center">
                      <View className="px-2 py-1 rounded-full bg-blue-100">
                        <Text className="text-xs text-blue-800">
                          {tool.type}
                        </Text>
                      </View>
                    </View>
                    <View className="w-20 items-center">
                      <View className={`px-2 py-1 rounded-full ${tool.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`text-xs ${tool.enabled ? 'text-green-800' : 'text-red-800'}`}>
                          {tool.enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    </View>
                    <View className="w-24 flex-row justify-center space-x-1">
                      <TouchableOpacity 
                        onPress={() => openEditModal(tool)}
                        className="p-2 bg-primary/10 rounded-lg"
                      >
                        <Ionicons name="pencil" size={16} className="!text-primary" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => handleDeleteTool(tool)}
                        className="p-2 bg-red-100 rounded-lg"
                      >
                        <Ionicons name="trash" size={16} className="!text-red-800" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Add Tool Modal */}
      <Modal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        className="w-2/3"
      >
        <View className="space-y-4 p-4">
          <Text className="text-xl font-bold text-primary">Add New Tool</Text>
          
          <View>
            <Text className="text-secondary mb-1">Name *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
              placeholder="Tool name"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />
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
              {Object.keys(toolBlueprints).length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {Object.keys(toolBlueprints).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setFormData({
                          ...formData, 
                          type,
                          configValues: {},
                          paramsSchema: toolBlueprints[type].paramsSchema,
                          configSchema: toolBlueprints[type].configSchema,
                        });
                      }}
                      className={`px-3 py-1 rounded-full ${formData.type === type ? 'bg-primary' : 'bg-primary/10'}`}
                    >
                      <Text className={`${formData.type === type ? 'text-white' : 'text-primary'}`}>
                        {type}
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
          
          {formData.type && toolBlueprints[formData.type]?.configSchema && (<View>
            <Text className="text-secondary mb-1">Configuration</Text>
            <View className="border border-border rounded-lg bg-surface p-3 space-y-3">
              {Object.keys(toolBlueprints[formData.type].configSchema || {}).slice(0, 5).map((key) => {
                const schema = toolBlueprints[formData.type].configSchema;
                const fieldConfig = typeof schema[key] === 'object' ? schema[key] : { type: 'string' };
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
              
              {Object.keys(toolBlueprints[formData.type].configSchema || {}).length === 0 && (
                <Text className="text-secondary italic p-2">No configuration fields available</Text>
              )}
            </View>
          </View>) }
          
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
              onPress={() => setShowAddModal(false)}
              className="bg-surface border border-border px-4 py-2 rounded-lg"
            >
              <Text className="text-text">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleAddTool}
              className="bg-primary px-4 py-2 rounded-lg"
              disabled={isLoading}
            >
              <Text className="text-white">Add Tool</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Tool Modal */}
      <Modal
        className="w-2/3 p-4"
        isVisible={showEditModal}
        onClose={() => setShowEditModal(false)}
      >
        <View className="space-y-4">
          <Text className="text-xl font-bold text-primary">Edit Tool</Text>
          
          <View>
            <Text className="text-secondary mb-1">Name *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="Tool name"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />
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
              {Object.keys(toolBlueprints).length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {Object.keys(toolBlueprints).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setFormData({
                          ...formData, 
                          type,
                          configValues: {},
                          paramsSchema: toolBlueprints[type].paramsSchema,
                          configSchema: toolBlueprints[type].configSchema,
                        });
                      }}
                      className={`px-3 py-1 rounded-full ${formData.type === type ? 'bg-primary' : 'bg-primary/10'}`}
                    >
                      <Text className={`${formData.type === type ? 'text-white' : 'text-primary'}`}>
                        {type}
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
          
          {formData.type && toolBlueprints[formData.type]?.configSchema && (<View>
            <Text className="text-secondary mb-1">Configuration</Text>
            <View className="border border-border rounded-lg bg-surface p-3 space-y-3">
              {Object.keys(toolBlueprints[formData.type].configSchema || {}).slice(0, 5).map((key) => {
                const schema = toolBlueprints[formData.type].configSchema;
                const fieldConfig = typeof schema[key] === 'object' ? schema[key] : { type: 'string' };
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
              
              {Object.keys(toolBlueprints[formData.type].configSchema || {}).length === 0 && (
                <Text className="text-secondary italic p-2">No configuration fields available</Text>
              )}
            </View>
          </View>) }
          
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
              onPress={() => setShowEditModal(false)}
              className="bg-surface border border-border px-4 py-2 rounded-lg"
            >
              <Text className="text-text">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUpdateTool}
              className="bg-primary px-4 py-2 rounded-lg"
              disabled={isLoading}
            >
              <Text className="text-white">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Tool Modal */}
      <Modal
        isVisible={showCreateBlueprintModal}
        onClose={() => setShowCreateBlueprintModal(false)}
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
              onPress={() => setShowCreateBlueprintModal(false)}
              className="bg-surface border border-border px-4 py-2 rounded-lg"
            >
              <Text className="text-text">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCreateToolBlueprint}
              className="bg-primary px-4 py-2 rounded-lg"
              disabled={isLoading}
            >
              <Text className="text-white">Create Blueprint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 