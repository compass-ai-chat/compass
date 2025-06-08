import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAtom } from "jotai";
import { polarisToolsAtom } from "@/src/hooks/atoms";
import PolarisServer from "@/src/services/polaris/PolarisServer";
import { Ionicons } from "@expo/vector-icons";
import { toastService } from "@/src/services/toastService";
import { Tool, CreateToolDto, UpdateToolDto } from "@/src/types/tools";
import { Modal } from "@/src/components/ui/Modal";
import CodeEditor from "@/src/components/ui/CodeEditor";
import { ToolBlueprint } from "@/src/tools/tool.interface";
import { SimpleSchema, zodSchemaToJsonSchema } from "@/src/utils/zodHelpers";
import { z } from "zod";

export default function Tools() {
  const [tools, setTools] = useAtom(polarisToolsAtom);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toolBlueprints, setToolBlueprints] = useState<ToolBlueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<ToolBlueprint | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateToolDto>({
    name: "",
    description: "",
    blueprintId: "",
    enabled: true,
    configValues: {},
  });

  useEffect(() => {
    loadTools();
    loadToolBlueprints();
  }, []);

  const loadTools = async () => {
    setIsLoading(true);
    const fetchedTools = await PolarisServer.getTools();
    setTools(fetchedTools);
    setIsLoading(false);
  };

  const loadToolBlueprints = async () => {
    const blueprints = await PolarisServer.getToolBlueprints();
    setToolBlueprints(blueprints);
  };

  const handleAddTool = async () => {
    if (!formData.name || !formData.description || !formData.blueprintId) {
      toastService.warning({ title: "Please fill all required fields" });
      return;
    }

    setIsLoading(true);
    const toolId = await PolarisServer.createTool(formData);
    if (toolId) {
      await loadTools();
      setShowAddModal(false);
      resetForm();
      toastService.success({ title: "Tool created successfully" });
    }
    setIsLoading(false);
  };

  const handleUpdateTool = async () => {
    if (!selectedTool) return;

    setIsLoading(true);
    const success = await PolarisServer.updateTool(selectedTool.id, formData);
    if (success) {
      await loadTools();
      setShowEditModal(false);
      resetForm();
      toastService.success({ title: "Tool updated successfully" });
    }
    setIsLoading(false);
  };

  const handleDeleteTool = async (tool: Tool) => {
    if (confirm(`Are you sure you want to delete ${tool.name}?`)) {
      setIsLoading(true);
      const success = await PolarisServer.deleteTool(tool.id);
      if (success) {
        await loadTools();
        toastService.success({ title: "Tool deleted successfully" });
      }
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      blueprintId: "",
      enabled: true,
      configValues: {},
    });
    setSelectedBlueprint(null);
  };

  const openEditModal = (tool: Tool) => {
    setSelectedTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      blueprintId: tool.blueprintId,
      enabled: tool.enabled,
      configValues: tool.configValues || {},
    });
    setSelectedBlueprint(toolBlueprints.find(blueprint => blueprint.name === tool.blueprintId) || null);
    setShowEditModal(true);
  };

  const filteredTools = tools.filter(tool => {
    const searchLower = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.blueprintId.toLowerCase().includes(searchLower)
    );
  });

  const getToolTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'mail';
      case 'search':
        return 'search';
      case 'database':
        return 'server';
      case 'api':
        return 'code';
      default:
        return 'construct';
    }
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
            onPress={loadTools}
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
                          name={getToolTypeIcon(tool.blueprintId)} 
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
                          {tool.blueprintId}
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
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Description *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
              placeholder="Tool description"
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Blueprint *</Text>
            <View className="border border-border rounded-lg p-2 bg-surface">
              {Object.keys(toolBlueprints).length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(toolBlueprints).map(([type, schemas]) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setSelectedBlueprint(toolBlueprints.find(blueprint => blueprint.name === type) || null);
                        setFormData({
                          ...formData, 
                          blueprintId: type,
                          configValues: {},
                        });
                      }}
                      className={`px-3 py-1 rounded-full ${selectedBlueprint?.name === type ? 'bg-primary' : 'bg-primary/10'}`}
                    >
                      <Text className={`${selectedBlueprint?.name === type ? 'text-white' : 'text-primary'}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-secondary italic">No blueprints available</Text>
              )}
            </View>
          </View>
          
          {selectedBlueprint?.configSchema && (
            <View>
              <Text className="text-secondary mb-1">Configuration</Text>
              <View className="border border-border rounded-lg bg-surface p-3 space-y-3">
                {Object.entries(selectedBlueprint?.configSchema || {}).map(([key, schema]: [string, any]) => {
                  const isSecret = schema.type === 'string' && (
                    key.toLowerCase().includes('secret') || 
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('password')
                  );
                  
                  return (
                    <View key={key}>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-secondary">{key}</Text>
                        {schema.description && (
                          <Text className="text-xs text-secondary/70 italic">{schema.description}</Text>
                        )}
                      </View>
                      <TextInput
                        className="border border-border rounded-lg p-2 bg-surface text-text"
                        placeholder={`Enter ${key}`}
                        value={formData.configValues?.[key] || ''}
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
        isVisible={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="w-2/3"
      >
        <View className="space-y-4 p-4">
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
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Blueprint *</Text>
            <View className="border border-border rounded-lg p-2 bg-surface">
              {Object.keys(toolBlueprints).length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(toolBlueprints).map(([type, schemas]) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setSelectedBlueprint(toolBlueprints.find(blueprint => blueprint.name === type) || null);
                        setFormData({
                          ...formData, 
                          blueprintId: type,
                          configValues: {},
                        });
                      }}
                      className={`px-3 py-1 rounded-full ${selectedBlueprint?.name === type ? 'bg-primary' : 'bg-primary/10'}`}
                    >
                      <Text className={`${selectedBlueprint?.name === type ? 'text-white' : 'text-primary'}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-secondary italic">No blueprints available</Text>
              )}
            </View>
          </View>
          
          {selectedBlueprint?.configSchema && (
            <View>
              <Text className="text-secondary mb-1">Configuration</Text>
              <View className="border border-border rounded-lg bg-surface p-3 space-y-3">
                {Object.entries(selectedBlueprint?.configSchema || {}).map(([key, schema]: [string, any]) => {
                  const isSecret = schema.type === 'string' && (
                    key.toLowerCase().includes('secret') || 
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('password')
                  );
                  
                  return (
                    <View key={key}>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-secondary">{key}</Text>
                        {schema.description && (
                          <Text className="text-xs text-secondary/70 italic">{schema.description}</Text>
                        )}
                      </View>
                      <TextInput
                        className="border border-border rounded-lg p-2 bg-surface text-text"
                        placeholder={`Enter ${key}`}
                        value={formData.configValues?.[key] || ''}
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
    </SafeAreaView>
  );
} 