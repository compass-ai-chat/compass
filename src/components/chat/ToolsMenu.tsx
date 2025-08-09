import React, { useCallback, useEffect, useRef } from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Switch } from "@/src/components/ui/Switch";
import {
  currentThreadAtom,
  hotToolsAtom,
  thinkingActiveAtom,
} from "@/src/hooks/atoms";
import { useAtom } from "jotai";
import { FontAwesome6 } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native-gesture-handler";

interface Tool {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap | typeof FontAwesome6.glyphMap;
  description: string;
}

interface ToolsMenuProps {}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({}) => {
  const [currentThread, setCurrentThread] = useAtom(currentThreadAtom);
  const [showToolsMenu, setShowToolsMenu] = React.useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  const [hotTools, setHotTools] = useAtom(hotToolsAtom);
  const [thinkingActive, setThinkingActive] = useAtom(thinkingActiveAtom);

  // Add this helper function before the ToolCallIndicator component
  const getIconComponent = (iconName: string, className: string) => {
    // List of all available Ionicons names
    const ioniconsNames = Object.keys(Ionicons.glyphMap);

    // Check if the icon exists in Ionicons
    if (ioniconsNames.includes(iconName)) {
      return (
        <Ionicons name={iconName as any} size={20} className={className} />
      );
    }

    // Fallback to FontAwesome
    // Convert kebab-case or snake_case to camelCase for FontAwesome
    const faName = iconName
      .replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
      .replace("-outline", "")
      .replace("-sharp", "");

    return (
      <FontAwesome6 name={faName as any} size={20} className={className} />
    );
  };

  const handleToggleTool = (toolId: string) => {
    setHotTools(async (prev) => {
      const newSet = await prev;
      if (newSet.includes(toolId)) {
        return newSet.filter((id) => id !== toolId);
      } else {
        return [...newSet, toolId];
      }
    });
  };

  let availableTools: Tool[] = [
    {
      id: "WebSearch",
      name: "Search",
      icon: "globe-outline",
      description: "Enable real-time web search capabilities",
    },
  ];

  // Only add thinking tool if the provider is ollama
  if (
    currentThread?.selectedModel?.provider.name === "Ollama" &&
    currentThread?.selectedModel?.name.toLowerCase().includes("qwen3")
  ) {
    availableTools.push({
      id: "Thinking",
      name: "Think",
      icon: "lightbulb",
      description: "Enable thinking capabilities",
    });
  }

  const handleShowMenu = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setShowToolsMenu(true);
  }, []);

  const handleHideMenu = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowToolsMenu(false);
    }, 300); // 300ms delay before closing
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const toolToggles = (availableTools: Tool[]) => {
    return availableTools.map((tool) => (
      <Pressable
        onPress={() => handleToggleTool(tool.id)}
        key={tool.id}
        className={`flex-row items-center p-2 border rounded-full hover:opacity-60 ${
          hotTools?.includes(tool.id)
            ? "!text-primary border-primary"
            : "border-border"
        }`}
      >
        {getIconComponent(
          tool.icon,
          `${hotTools?.includes(tool.id) ? "!text-primary" : "!text-text"} mr-2`,
        )}
        <Text
          className={`${hotTools?.includes(tool.id) ? "!text-primary" : "!text-text"}`}
        >
          {tool.name}
        </Text>
      </Pressable>
    ));
  };

  if (Platform.OS === "web" && availableTools.length <= 2) {
    return (
      <View className="flex-row items-center space-x-1 mr-auto">
        {toolToggles(availableTools)}
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <div onMouseEnter={handleShowMenu} onMouseLeave={handleHideMenu}>
        <Pressable
          onPress={() => setShowToolsMenu(!showToolsMenu)}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="apps" size={24} className="!text-text" />
        </Pressable>

        {showToolsMenu && (
          <div
            onMouseEnter={handleShowMenu}
            onMouseLeave={handleHideMenu}
            className="absolute bottom-full left-0 mb-2"
          >
            <View className="bg-surface border border-primary rounded-lg p-2 shadow-lg">
              {toolToggles(availableTools)}
            </View>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setShowToolsMenu(!showToolsMenu)}
        className="w-10 h-10 items-center justify-center"
      >
        <Ionicons name="apps" size={24} className="!text-text" />
      </Pressable>

      {showToolsMenu && (
        <View className="absolute bottom-full left-0 mb-2 bg-surface border border-primary rounded-lg p-2 shadow-lg">
          {availableTools.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => handleToggleTool(tool.id)}
              className={`flex-row items-center p-2 rounded-md ${
                hotTools?.includes(tool.id) ? "bg-primary/20" : ""
              }`}
            >
              <Ionicons name={tool.icon} size={20} />
              <Text className="ml-2 text-text">{tool.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
};
