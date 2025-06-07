import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toastService } from "@/src/services/toastService";
import { Tool, CreateToolDto, UpdateToolDto } from "@/src/types/tools";
import { ToolsHeader } from "./ToolsHeader";
import { ToolsList } from "./ToolsList";
import { AddToolModal } from "./AddToolModal";
import { EditToolModal } from "./EditToolModal";
import { BlueprintManager } from "./BlueprintManager";
import { ToolBlueprint } from "@/src/tools/tool.interface";

interface ToolsProps {
  tools: Tool[];
  toolBlueprints: ToolBlueprint[];
  onToolAdded: (formData: CreateToolDto) => Promise<string>;
  onToolUpdated: (toolId: string, formData: UpdateToolDto) => Promise<boolean>;
  onToolDeleted: (toolId: string) => Promise<boolean>;
  onLoadTools: () => Promise<void>;
}

export default function Tools({ tools, toolBlueprints, onToolAdded, onToolUpdated, onToolDeleted, onLoadTools }: ToolsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlueprintManager, setShowBlueprintManager] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<ToolBlueprint | null>(null);

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
    setSelectedBlueprint(toolBlueprints.find((blueprint) => blueprint.name === tool.type) || null);
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
          onListBlueprints={() => setShowBlueprintManager(true)}
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
        toolBlueprint={selectedBlueprint!}
        showCodeEditor={showCodeEditor}
        setShowCodeEditor={setShowCodeEditor}
        defaultCodeTemplate={defaultCodeTemplate}
      />

      <BlueprintManager
        isVisible={showBlueprintManager}
        onClose={() => setShowBlueprintManager(false)}
      />
    </SafeAreaView>
  );
} 