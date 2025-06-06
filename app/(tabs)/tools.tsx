import { View, Platform } from "react-native";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultThreadAtom,
  currentIndexAtom,
  threadActionsAtom,
  threadsAtom,
  saveCustomPrompts,
  userCharactersAtom,
  userToolsAtom
} from "@/src/hooks/atoms";
import { Character } from "@/src/types/core";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { availableModelsAtom, userDocumentsAtom } from "@/src/hooks/atoms";
import Tools from "@/src/components/tools/tools";
import { CreateToolDto, Tool, UpdateToolDto } from "@/src/types/tools";
import { useTools } from "@/src/hooks/useTools";
export default function ToolsScreen() {
  const [userTools, setUserTools] = useAtom(userToolsAtom);
  const { getToolTypes } = useTools();

  const handleAddTool = async (tool: CreateToolDto) => {
    
    // create a new tool with the same name as the tool
    const newTool = {
      ...tool,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Tool;
    await setUserTools([...userTools, newTool]);
    console.log("New tool", newTool);
    console.log("New usertools", userTools);
    return newTool.id;
  }

  const handleUpdateTool = async (toolId: string, tool: UpdateToolDto) => {
    // update the tool with the same id
    const updatedTool = userTools.find(t => t.id === toolId);
    if (updatedTool) {
      updatedTool.name = tool.name;
      updatedTool.description = tool.description;
      updatedTool.type = tool.type;
      updatedTool.configValues = tool.configValues;
      updatedTool.enabled = tool.enabled ?? true;
      return true;
    }
    return false;
  }

  const handleDeleteTool = async (toolId: string) => {
    const updatedTools = userTools.filter(t => t.id !== toolId);
    setUserTools(updatedTools);
    return true;
  }

  return (
    <View className="flex-1 bg-background flex-row">
      <Tools
        tools={userTools}
        toolTypes={getToolTypes()}
        onToolAdded={handleAddTool}
        onToolUpdated={handleUpdateTool}
        onToolDeleted={handleDeleteTool}
        onLoadTools={() => Promise.resolve()}
      />
    </View>
  );
}
