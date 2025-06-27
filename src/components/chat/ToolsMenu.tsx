import React, { useCallback, useRef } from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from '@/src/components/ui/Switch';

interface Tool {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface ToolsMenuProps {
  activeTools: Set<string>;
  onToggleTool: (toolId: string) => void;
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({ activeTools, onToggleTool }) => {
  const [showToolsMenu, setShowToolsMenu] = React.useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const availableTools: Tool[] = [
    {
      id: 'WebSearch',
      name: 'Web Search',
      icon: 'globe-outline',
      description: 'Enable real-time web search capabilities'
    }
    // Add more tools here in the future
  ];

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

  if (Platform.OS === 'web') {
    return (
      <div 
        onMouseEnter={handleShowMenu}
        onMouseLeave={handleHideMenu}
      >
        <Pressable
          onPress={() => setShowToolsMenu(!showToolsMenu)}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons 
            name="apps" 
            size={24} 
            className='!text-text'
          />
        </Pressable>

        {showToolsMenu && (
          <div
            onMouseEnter={handleShowMenu}
            onMouseLeave={handleHideMenu}
            className="absolute bottom-full left-0 mb-2"
          >
            <View className="bg-surface border border-primary rounded-lg p-2 shadow-lg">
              {availableTools.map((tool) => (
                <View
                  key={tool.id}
                  className={`flex-row items-center p-2 rounded-md ${
                    activeTools.has(tool.id) ? 'bg-primary/20' : ''
                  }`}
                >
                  <Ionicons
                    name={tool.icon}
                    size={20}
                    className='!text-text mr-2'
                  />
                  <Switch
                value={activeTools.has(tool.id)}
                onValueChange={() => onToggleTool(tool.id)}
              />
                  
                  {/* <Text className="ml-2 text-text">{tool.name}</Text> */}
                </View>
              ))}
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
        <Ionicons 
          name="apps" 
          size={24} 
          className='!text-text'
        />
      </Pressable>

      {showToolsMenu && (
        <View className="absolute bottom-full left-0 mb-2 bg-surface border border-primary rounded-lg p-2 shadow-lg">
          {availableTools.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => onToggleTool(tool.id)}
              className={`flex-row items-center p-2 rounded-md ${
                activeTools.has(tool.id) ? 'bg-primary/20' : ''
              }`}
            >
              <Ionicons
                name={tool.icon}
                size={20}
              />
              <Text className="ml-2 text-text">{tool.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}; 