import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAtomValue } from 'jotai';
import { isDarkModeAtom } from '@/src/hooks/atoms';

interface MessageActionsProps {
  isUser: boolean;
  hasPreviewableCode?: boolean;
  onCopy: () => void;
  onPreviewCode?: () => void;
  onEdit?: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  isUser,
  hasPreviewableCode,
  onCopy,
  onPreviewCode,
  onEdit,
}) => {
  const isDark = useAtomValue(isDarkModeAtom);
  
  return (
    <View className="absolute -bottom-4 right-0 flex-row bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
      <TouchableOpacity 
        onPress={onCopy}
        className="p-2 flex-row items-center"
      >
        <Ionicons name="copy-outline" size={16} color={isDark ? "#fff" : "#000"} />
        <Text className="text-xs ml-1 text-text">Copy</Text>
      </TouchableOpacity>
      {!isUser && hasPreviewableCode && (
        <TouchableOpacity 
          onPress={onPreviewCode}
          className="p-2 flex-row items-center border-l border-border"
        >
          <Ionicons name="code-outline" size={16} color={isDark ? "#fff" : "#000"} />
          <Text className="text-xs ml-1 text-text">Preview</Text>
        </TouchableOpacity>
      )}
      {isUser && (
        <TouchableOpacity 
          onPress={onEdit}
          className="p-2 flex-row items-center border-l border-border"
        >
          <Ionicons name="pencil-outline" size={16} color={isDark ? "#fff" : "#000"} />
          <Text className="text-xs ml-1 text-text">Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}; 