import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { useTools } from "@/src/hooks/useTools";
import { useCharacterModelSelection } from "@/src/hooks/useCharacterModelSelection";
import { hotToolsAtom, thinkingActiveAtom } from "@/src/hooks/atoms";
import { Tool } from "@/src/types/tools";
import { IconComponent } from "@/src/components/common/iconHelpers";

interface ToolsMenuProps {
  onToolToggle?: (toolId: string, enabled: boolean) => void;
  className?: string;
}

interface ToolMenuItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  category?: 'search' | 'utility' | 'thinking' | 'custom';
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({ 
  onToolToggle,
  className = ""
}) => {
  const [showToolsMenu, setShowToolsMenu] = React.useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  const [hotTools, setHotTools] = useAtom(hotToolsAtom);
  const [thinkingActive, setThinkingActive] = useAtom(thinkingActiveAtom);
  
  const { selectedModel } = useCharacterModelSelection();
  const { getTools, getIcon, isToolSupported, getToolCategory } = useTools();

  // Get all available tools from the tool registry
  const availableTools = useMemo(() => {
    const tools = getTools();
    const toolItems: ToolMenuItem[] = [];

    // Filter tools by category and support
    tools.forEach(tool => {
      // Skip if tool is not supported for current model
      if (!isToolSupported(tool.id, selectedModel)) {
        return;
      }

      const category = getToolCategory(tool.id) as ToolMenuItem['category'];

      toolItems.push({
        id: tool.id,
        name: tool.name,
        icon: getIcon(tool.id),
        description: tool.description,
        enabled: hotTools.includes(tool.id),
        category
      });
    });

    return toolItems;
  }, [getTools, getIcon, isToolSupported, getToolCategory, hotTools, selectedModel]);



  // Handle tool toggle
  const handleToggleTool = useCallback((toolId: string) => {
    setHotTools(async (prev) => {
      const newSet = await prev;
      const isEnabled = newSet.includes(toolId);
      const newHotTools = isEnabled 
        ? newSet.filter((id) => id !== toolId)
        : [...newSet, toolId];
      
      // Call optional callback
      onToolToggle?.(toolId, !isEnabled);
      
      return newHotTools;
    });
  }, [setHotTools, onToolToggle]);

  // Menu visibility handlers
  const handleShowMenu = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setShowToolsMenu(true);
  }, []);

  const handleHideMenu = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowToolsMenu(false);
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Render tool toggle button
  const renderToolToggle = useCallback((tool: ToolMenuItem) => (
    <Pressable
      onPress={() => handleToggleTool(tool.id)}
      key={tool.id}
      className={`flex-row items-center p-2 border rounded-full hover:opacity-60 transition-colors ${
        tool.enabled
          ? "!text-primary border-primary bg-primary/10"
          : "border-border hover:border-primary/50"
      }`}
    >
      <IconComponent
        iconName={tool.icon}
        className={`${tool.enabled ? "!text-primary" : "!text-text"} mr-2`}
        size={20}
      />
      <Text
        className={`text-sm font-medium ${
          tool.enabled ? "!text-primary" : "!text-text"
        }`}
      >
        {tool.name}
      </Text>
    </Pressable>
  ), [handleToggleTool, IconComponent]);

  // Render tool menu item (for dropdown)
  const renderToolMenuItem = useCallback((tool: ToolMenuItem) => (
    <Pressable
      key={tool.id}
      onPress={() => handleToggleTool(tool.id)}
      className={`flex-row items-center hover:opacity-60 transition-opacity p-3 rounded-md ${
        tool.enabled 
          ? "border border-primary" 
          : ""
      }`}
    >
      <IconComponent
        iconName={tool.icon}
        className={`${tool.enabled ? "!text-primary" : "!text-text"} mr-3`}
        size={20}
      />
      <View className="flex-1">
        <Text className={`font-medium ${tool.enabled ? "!text-primary" : "!text-text"}`}>
          {tool.name.charAt(0).toUpperCase() + tool.name.slice(1)}
        </Text>
        <Text className="text-xs text-text mt-1">
          {tool.description}
        </Text>
      </View>
    </Pressable>
  ), [handleToggleTool, IconComponent]);

  // Group tools by category for better organization
  const groupedTools = useMemo(() => {
    const groups: Record<string, ToolMenuItem[]> = {};
    availableTools.forEach(tool => {
      const category = tool.category || 'custom';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(tool);
    });
    return groups;
  }, [availableTools]);

  // If no tools available, don't render anything
  if (availableTools.length === 0) {
    return null;
  }

  // For web with few tools, show inline toggles
  if (Platform.OS === "web" && availableTools.length <= 3) {
    return (
      <View className={`flex-row items-center space-x-2 ${className}`}>
        {availableTools.map(renderToolToggle)}
      </View>
    );
  }

  // For web with many tools, show dropdown menu
  if (Platform.OS === "web") {
    return (
      <div 
        className={className}
        onMouseEnter={handleShowMenu} 
        onMouseLeave={handleHideMenu}
      >
        <Pressable
          onPress={() => setShowToolsMenu(!showToolsMenu)}
          className="w-10 h-10 items-center justify-center rounded-lg hover:bg-surface-hover transition-colors"
        >
          <Ionicons name="apps" size={24} className="!text-text" />
        </Pressable>

        {showToolsMenu && (
          <div
            onMouseEnter={handleShowMenu}
            onMouseLeave={handleHideMenu}
            className="absolute bottom-full left-0 mb-2 z-50"
          >
            <View className="bg-surface border border-border rounded-lg p-3 shadow-lg min-w-64 max-h-80 overflow-y-auto">
              {Object.entries(groupedTools).map(([category, tools]) => (
                <View key={category} className="mb-3 last:mb-0">
                  {Object.keys(groupedTools).length > 1 && (
                    <Text className="text-xs font-medium text-text mb-2 uppercase tracking-wide">
                      {category}
                    </Text>
                  )}
                  {tools.map(renderToolMenuItem)}
                </View>
              ))}
            </View>
          </div>
        )}
      </div>
    );
  }

  // For mobile, show dropdown menu
  return (
    <View className={className}>
      <Pressable
        onPress={() => setShowToolsMenu(!showToolsMenu)}
        className="w-10 h-10 items-center justify-center rounded-lg"
      >
        <Ionicons name="apps" size={24} className="!text-text" />
      </Pressable>

      {showToolsMenu && (
        <View className="absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-lg p-3 shadow-lg min-w-64 max-h-80 overflow-y-auto z-50">
          {Object.entries(groupedTools).map(([category, tools]) => (
            <View key={category} className="mb-3 last:mb-0">
              {Object.keys(groupedTools).length > 1 && (
                <Text className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
                  {category}
                </Text>
              )}
              {tools.map(renderToolMenuItem)}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
