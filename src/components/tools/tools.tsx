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
import { CreateBlueprintModal } from "./CreateBlueprintModal";
import { ToolsHeader } from "./ToolsHeader";
import { ToolsList } from "./ToolsList";
import { AddToolModal } from "./AddToolModal";
import { EditToolModal } from "./EditToolModal";

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
        <ToolsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={onLoadTools}
          onAddTool={() => {
            resetForm();
            setShowAddModal(true);
          }}
          onCreateBlueprint={() => {
            resetCreateForm();
            setShowCreateBlueprintModal(true);
          }}
          onListBlueprints={printToolBlueprints}
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-secondary">Loading tools...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1">
            <ToolsList
              tools={filteredTools}
              onEditTool={openEditModal}
              onDeleteTool={handleDeleteTool}
            />
          </ScrollView>
        )}
      </View>

      <AddToolModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        isLoading={isLoading}
        formData={formData}
        setFormData={setFormData}
        onAddTool={handleAddTool}
        toolBlueprints={toolBlueprints}
        showCodeEditor={showCodeEditor}
        setShowCodeEditor={setShowCodeEditor}
        defaultCodeTemplate={defaultCodeTemplate}
      />

      <EditToolModal
        isVisible={showEditModal}
        onClose={() => setShowEditModal(false)}
        isLoading={isLoading}
        selectedTool={selectedTool}
        formData={formData}
        setFormData={setFormData}
        onUpdateTool={handleUpdateTool}
        toolBlueprints={toolBlueprints}
        showCodeEditor={showCodeEditor}
        setShowCodeEditor={setShowCodeEditor}
        defaultCodeTemplate={defaultCodeTemplate}
      />

      <CreateBlueprintModal
        isVisible={showCreateBlueprintModal}
        onClose={() => setShowCreateBlueprintModal(false)}
        isLoading={isLoading}
        createToolData={createToolData}
        setCreateToolData={setCreateToolData}
        onCreateBlueprint={handleCreateToolBlueprint}
        extractSchemas={extractSchemas}
      />
    </SafeAreaView>
  );
} 