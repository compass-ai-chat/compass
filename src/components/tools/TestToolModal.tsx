import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Modal } from "@/src/components/ui/Modal";
import { Tool } from "@/src/types/tools";
import { zodSchemaToJsonSchema } from "@/src/utils/zodHelpers";
import { toastService } from "@/src/services/toastService";
import { Ionicons } from "@expo/vector-icons";
import CodeEditor from "@/src/components/ui/CodeEditor";
import { useTools } from "@/src/hooks/useTools";
import { TextInput } from "react-native-gesture-handler";

interface TestToolModalProps {
  isVisible: boolean;
  onClose: () => void;
  tool: Tool | null;
}

export function TestToolModal({ isVisible, onClose, tool }: TestToolModalProps) {
  const [params, setParams] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { executeTool } = useTools();

  const handleTest = async () => {
    if (!tool) return;
    
    setIsLoading(true);
    setIsError(false);
    setResponse(null);
    
    try {
      const result = await executeTool(tool.id, params);
      setResponse(result);
      setIsError(false);
    } catch (error) {
      console.error("Tool test failed:", error);
      setIsError(true);
      setResponse(error instanceof Error ? error.message : "Unknown error occurred");
      toastService.danger({ title: "Test Failed", description: "Failed to execute tool test" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderParamsInput = () => {
    console.log("tool", tool);
    if (!tool?.paramsSchema) return null;

    //const schema = zodSchemaToJsonSchema(tool.paramsSchema);
    //if (!schema.properties) return null;

    return Object.entries(tool.paramsSchema).map(([key, value]: [string, any]) => (
      <View key={key} className="mb-4">
        <Text className="text-secondary mb-1 capitalize">{key}</Text>
        <TextInput
          className="border border-border rounded-lg p-2 bg-surface text-text outline-none"
          placeholder={`Enter ${key}`}
          value={params[key] || ""}
          onChangeText={(text) => setParams({ ...params, [key]: text })}
        />
      </View>
    ));
  };

  const renderResponse = () => {
    if (isLoading) {
      return (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="text-secondary mt-4">Testing tool...</Text>
        </View>
      );
    }

    if (!response) return null;

    return (
      <View className="mt-4">
        <Text className="text-lg font-semibold text-text mb-2">Response:</Text>
        <View className={`rounded-lg p-4 ${isError ? 'bg-red-100' : 'bg-surface'}`}>
          <CodeEditor
            value={typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
            language="json"
            readOnly
            onChangeText={() => {}}
            className="min-h-[200px] h-full"
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="w-2/3"
    >
      <View className="p-6 bg-background rounded-lg">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Ionicons 
                name={tool?.icon as any || 'construct'} 
                size={20} 
                className="!text-primary" 
              />
            </View>
            <View>
              <Text className="text-xl font-bold text-text">{tool?.name || 'Test Tool'}</Text>
              <Text className="text-secondary">{tool?.description}</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={onClose}
            className="p-2 rounded-full bg-surface"
          >
            <Ionicons name="close" size={24} className="!text-secondary" />
          </TouchableOpacity>
        </View>

        <ScrollView className="max-h-[70vh]">
          <View className="mb-6">
            <Text className="text-lg font-semibold text-text mb-4">Parameters</Text>
            {renderParamsInput()}
          </View>

          {renderResponse()}
        </ScrollView>

        <View className="flex-row justify-end mt-6 pt-4 border-t border-border">
          <TouchableOpacity
            onPress={onClose}
            className="px-4 py-2 rounded-lg bg-surface mr-2"
          >
            <Text className="text-text">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleTest}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg flex-row items-center ${isLoading ? 'bg-primary/50' : 'bg-primary'}`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" className="mr-2" />
            ) : (
              <Ionicons name="play" size={18} color="white" className="mr-2" />
            )}
            <Text className="text-white font-medium">
              {isLoading ? 'Testing...' : 'Test Tool'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// This function would need to be implemented to actually execute the tool
async function executeToolTest(tool: Tool, params: Record<string, any>): Promise<any> {
  // This is a placeholder - you'll need to implement the actual tool execution
  // You might want to use your ToolRegistry or similar service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        params,
        timestamp: new Date().toISOString(),
        result: "Tool execution simulation successful"
      });
    }, 1500);
  });
} 