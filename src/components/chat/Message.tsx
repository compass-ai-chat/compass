import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useColorScheme } from 'nativewind';
import { Character } from '@/src/types/core';
import { Text } from 'react-native';
import { currentThreadAtom, editingMessageIndexAtom, fontPreferencesAtom, isGeneratingAtom } from '@/src/hooks/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { InteractionManager, Clipboard } from 'react-native';
import { toastService } from '@/src/services/toastService';
import { Ionicons } from '@expo/vector-icons';
import { CharacterAvatar } from '../character/CharacterAvatar';
import { MessageActions } from './MessageActions';
import { ThinkBlock } from './ThinkBlock';

interface MessageProps {
  content: string;
  isUser: boolean;
  character?: Character;
  index: number;
  onEdit?: (index: number) => void;
  onPreviewCode?: () => void;
  hasPreviewableCode?: boolean;
}

interface CodeBlockProps {
  content: string;
  sourceInfo?: string;
  isDark: boolean;
  style: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, sourceInfo, isDark, style, isExpanded, onToggleExpand }) => {
  const handleCopy = () => {
    Clipboard.setString(content);
    toastService.success({
      title: 'Copied to clipboard',
      description: ""
    });
  };

  return (
    <View style={style} className="border-border border">
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={onToggleExpand}
          className="mr-2 p-1 flex-row items-center"
        >
          <Ionicons 
            name={isExpanded ? "chevron-down" : "chevron-forward"} 
            size={16} 
            color={isDark ? "#fff" : "#000"}
          />
          {sourceInfo && <Text className="pl-2 text-md pt-1 text-text opacity-50">Generated {sourceInfo} code </Text>}
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleCopy}
          className="bg-surface border-border border px-2 py-1 rounded flex-row items-center hover:opacity-60"
        >
          <Ionicons name="copy" size={16} className='!text-text'/>
          <Text className="text-xs text-text ml-1">Copy</Text>
        </TouchableOpacity>
      </View>
      {isExpanded && (
        <Text className='text-text' style={{ fontFamily: 'monospace' }}>{content}</Text>
      )}
    </View>
  );
};

export const Message: React.FC<MessageProps> = ({ content, isUser, character, index, onEdit, onPreviewCode, hasPreviewableCode }) => {
  const { colorScheme } = useColorScheme();
  const currentThread = useAtomValue(currentThreadAtom);
  const preferences = useAtomValue(fontPreferencesAtom);
  const editingMessageIndex = useAtomValue(editingMessageIndexAtom);
  const isDark = colorScheme === 'dark';
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);

  const markdownStyles = {
    body: {
      color: isUser ? '#fff' : (isDark ? '#fff' : '#1f2937'),
      fontFamily: preferences.fontFamily,
      fontSize: preferences.fontSize,
      lineHeight: preferences.lineHeight,
      letterSpacing: preferences.letterSpacing
    },
    code_block: {
      backgroundColor: isUser ? '#1e40af' : (isDark ? '#374151' : '#f3f4f6'),
      padding: 8,
      borderRadius: 8,
      fontFamily: 'monospace',
    },
    code_inline: {
      backgroundColor: isUser ? '#1e40af' : (isDark ? '#374151' : '#f3f4f6'),
      padding: 4,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    fence: {
      backgroundColor: isUser ? '#1e40af' : (isDark ? '#374151' : '#f3f4f6'),
      padding: 8,
      borderRadius: 8,
      fontFamily: 'monospace',
    },
  };

  const [displayContent, setDisplayContent] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<string>>(new Set());
  const [expandedThinkBlocks, setExpandedThinkBlocks] = useState<Set<string>>(new Set());
  const [thinkingContent, setThinkingContent] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      // Check for thinking tags
      const thinkMatch = content.match(/<think>(.*?)<\/think>/s);
      if (thinkMatch) {
        setThinkingContent(thinkMatch[1].trim());
        setIsThinking(true);
        // Remove the thinking tags from display content
        setDisplayContent(content.replace(/<think>.*?<\/think>/s, '').trim());
      } else {
        setDisplayContent(content);
        setIsThinking(false);
      }
    });
  }, [content]);

  const renderCodeBlock = (node: any) => {
    const blockId = `${node.content}-${index}`;
    
    const handleToggleExpand = () => {
      setExpandedCodeBlocks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(blockId)) {
          newSet.delete(blockId);
        } else {
          newSet.add(blockId);
        }
        return newSet;
      });
    };

    return (
      <CodeBlock 
        key={blockId}
        content={node.content}
        sourceInfo={node.sourceInfo}
        isDark={isDark}
        style={markdownStyles.code_block}
        isExpanded={expandedCodeBlocks.has(blockId)}
        onToggleExpand={handleToggleExpand}
      />
    );
  };

  const handleCopyMessage = () => {
    Clipboard.setString(content);
    toastService.success({
      title: 'Message copied to clipboard',
      description: ""
    });
  };

  function parseContent(content: string): Array<{ type: 'text' | 'annotation'; content: string }> {
    const parts: { type: 'text' | 'annotation'; content: string }[] = [];
    const regex = /\*(.*?)\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the annotation if any
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Add the annotation without asterisks
      parts.push({
        type: 'annotation',
        content: match[1]
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text if any
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts;
  }

  const handleToggleThinkBlock = () => {
    setExpandedThinkBlocks(prev => {
      const newSet = new Set(prev);
      const blockId = `think-${index}`;
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  return (
    <View className={`flex flex-row ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      {/* {!isUser && (
        <View className="mr-2 items-center my-auto">
          <CharacterAvatar 
            character={character || currentThread.character} 
            size={32} 
          />
          <Text className="text-xs mt-1 text-gray-600 dark:text-gray-400 font-bold">
            {character?.name || currentThread.character?.name}
          </Text>
        </View>
      )} */}
      { !isUser && displayContent.length == 0 && isGenerating && (
        <View className="relative">
          <View className="bg-surface border border-border w-10 h-10 rounded-full items-center justify-center shadow-md">
            <Ionicons 
              name="compass" 
              size={24} 
              className={`!text-primary ${Platform.OS === 'web' ? 'animate-spin duration-[2000ms]' : ''}`}
            />
          </View>
        </View>
      )}
      { (displayContent.length > 0 || isThinking) && (
        <View 
          className={`relative px-4 py-2 mb-4 rounded-2xl max-w-[100%] ${
            isUser ? "bg-primary rounded-tr-none" : "bg-surface rounded-tl-none"
          } ${editingMessageIndex === index ? "bg-yellow-500" : ""}`}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {editingMessageIndex === index && (
            <Text className="text-yellow-400 text-xs mb-1">Editing...</Text>
          )}
          {editingMessageIndex !== index && (
            <View>
              {isThinking && thinkingContent && (
                <ThinkBlock
                  content={thinkingContent}
                  isDark={isDark}
                  style={markdownStyles.code_block}
                  isExpanded={expandedThinkBlocks.has(`think-${index}`)}
                  onToggleExpand={handleToggleThinkBlock}
                />
              )}
              {displayContent && (
                <Markdown 
                  style={markdownStyles}
                  rules={{
                    fence: renderCodeBlock,
                    code_block: renderCodeBlock,
                  }}
                >
                  {displayContent}
                </Markdown>
              )}
            </View>
          )}
          
          {isHovered && (
            <MessageActions
              isUser={isUser}
              hasPreviewableCode={hasPreviewableCode}
              onCopy={handleCopyMessage}
              onPreviewCode={onPreviewCode}
              onEdit={() => onEdit?.(index)}
            />
          )}
        </View>
      )}
    </View>
  );
}; 