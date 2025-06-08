import { View, Platform } from "react-native";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  userToolsAtom
} from "@/src/hooks/atoms";
import Tools from "@/src/components/tools/tools";
import { CreateToolDto, Tool, UpdateToolDto } from "@/src/types/tools";
import { useTools } from "@/src/hooks/useTools";
export default function ToolsScreen() {
  const [userTools, setUserTools] = useAtom(userToolsAtom);
  const { getToolBlueprints } = useTools();

  const handleAddTool = async (tool: CreateToolDto) => {
    // create a new tool with the same name as the tool
    console.log("Adding tool", tool);
    const newTool = {
      ...tool,
      id: Date.now().toString(),
      blueprintId: tool.blueprintId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Tool;
    
    // Update userTools state
    const updatedTools = [...userTools, newTool];
    await setUserTools(updatedTools);
    
    console.log("New tool", newTool);
    console.log("New usertools", updatedTools);
    return newTool.id;
  }

  const handleUpdateTool = async (toolId: string, tool: UpdateToolDto) => {
    // Create a new array with the updated tool
    const updatedTools = userTools.map(t => {
      if (t.id === toolId) {
        return {
          ...t,
          name: tool.name,
          description: tool.description,
          blueprintId: tool.blueprintId,
          configValues: tool.configValues,
          enabled: tool.enabled ?? true,
          icon: tool.icon,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    await setUserTools(updatedTools);
    return true;
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
        toolBlueprints={getToolBlueprints()}
        onToolAdded={handleAddTool}
        onToolUpdated={handleUpdateTool}
        onToolDeleted={handleDeleteTool}
        onLoadTools={() => Promise.resolve()}
      />
    </View>
  );
}
