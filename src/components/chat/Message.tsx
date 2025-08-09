import React, { useState, useEffect } from "react";
import { View, Image, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import Markdown from "react-native-markdown-display";
import { useColorScheme } from "nativewind";
import { Character, ChatMessage } from "@/src/types/core";
import { Text } from "react-native";
import {
  currentThreadAtom,
  editingMessageIndexAtom,
  fontPreferencesAtom,
  isGeneratingAtom,
} from "@/src/hooks/atoms";
import { useAtom, useAtomValue } from "jotai";
import { InteractionManager, Clipboard } from "react-native";
import { toastService } from "@/src/services/toastService";
import { Ionicons } from "@expo/vector-icons";
import { MessageActions } from "./MessageActions";
import { ThinkBlock } from "./ThinkBlock";
import { ToolCall } from "@/src/services/chat/providers/VercelAIProvider";
import { MentionedDocument } from "./MentionedDocument";
import { getMessageRole } from "@/src/utils/chatMessage";

interface MessageProps {
  message: ChatMessage;
  content: string;
  isUser: boolean;
  character?: Character;
  index: number;
  onEdit?: (index: number) => void;
  onPreviewCode?: () => void;
  hasPreviewableCode?: boolean;
  modelUsed?: {
    id: string;
    providerId: string;
  };
}

interface CodeBlockProps {
  content: string;
  sourceInfo?: string;
  isDark: boolean;
  style: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  content,
  sourceInfo,
  isDark,
  style,
  isExpanded,
  onToggleExpand,
}) => {
  const handleCopy = () => {
    Clipboard.setString(content);
    toastService.success({
      title: "Copied to clipboard",
      description: "",
    });
  };

  return (
    <View style={style} className="border-border border mb-4">
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
          {sourceInfo && (
            <Text className="pl-2 text-md pt-1 text-text opacity-50">
              Generated {sourceInfo} code{" "}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCopy}
          className="bg-surface border-border border px-2 py-1 rounded flex-row items-center hover:opacity-60"
        >
          <Ionicons name="copy" size={16} className="!text-text" />
          <Text className="text-xs text-text ml-1">Copy</Text>
        </TouchableOpacity>
      </View>
      {isExpanded && (
        <Text className="text-text" style={{ fontFamily: "monospace" }}>
          {content}
        </Text>
      )}
    </View>
  );
};

interface ToolCallIndicatorProps {
  toolCall: ToolCall;
  isDark: boolean;
}

const ToolCallIndicator: React.FC<ToolCallIndicatorProps> = ({
  toolCall,
  isDark,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <View
      className="mr-2 mb-2 flex-row items-center"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <View
        className={`bg-surface border border-border rounded-full px-2 py-2 flex-row items-center transition-all duration-300 ease-in-out ${toolCall?.pending ? "animate-pulse" : ""}`}
      >
        {toolCall?.pending ? (
          <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
        ) : (
          <Ionicons
            name={toolCall.icon as any}
            size={16}
            className="!text-text opacity-70"
          />
        )}
        <Text
          className={`h-4 text-text text-sm transition-all duration-300 ease-in-out overflow-hidden ${(isHovered || toolCall?.pending) ? "opacity-100 ml-2" : "opacity-0 max-w-0 h-0"}`}
        >
          {toolCall?.pending ? toolCall.status : toolCall.status}
        </Text>
      </View>
    </View>
  );
};

export const Message: React.FC<MessageProps> = ({
  message,
  content,
  isUser,
  character,
  index,
  onEdit,
  onPreviewCode,
  hasPreviewableCode,
  modelUsed,
}) => {
  const { colorScheme } = useColorScheme();
  const currentThread = useAtomValue(currentThreadAtom);
  const preferences = useAtomValue(fontPreferencesAtom);
  const editingMessageIndex = useAtomValue(editingMessageIndexAtom);
  const isDark = colorScheme === "dark";
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [thinkBlocks, setThinkBlocks] = useState<string[]>([]);

  const isFromUser = isUser ?? getMessageRole(message) === "user";

  const markdownStyles = {
    body: {
      color: isFromUser ? "#fff" : isDark ? "#fff" : "#1f2937",
      fontFamily: preferences.fontFamily,
      fontSize: preferences.fontSize,
      lineHeight: preferences.lineHeight,
      letterSpacing: preferences.letterSpacing,
    },
    code_block: {
      backgroundColor: isFromUser ? "#1e40af" : isDark ? "#374151" : "#f3f4f6",
      padding: 8,
      borderRadius: 8,
      fontFamily: "monospace",
    },
    code_inline: {
      backgroundColor: isFromUser ? "#1e40af" : isDark ? "#374151" : "#f3f4f6",
      padding: 4,
      borderRadius: 4,
      fontFamily: "monospace",
    },
    fence: {
      backgroundColor: isFromUser ? "#1e40af" : isDark ? "#374151" : "#f3f4f6",
      padding: 8,
      borderRadius: 8,
      fontFamily: "monospace",
    },
    hr: {
      backgroundColor: isFromUser ? "#1e40af" : isDark ? "#374151" : "#f3f4f6",
      height: 2,
      padding: 1,
      margin: 8,
    },
  };

  const [displayContent, setDisplayContent] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<string>>(
    new Set(),
  );
  const [expandedThinkBlocks, setExpandedThinkBlocks] = useState<Set<string>>(
    new Set(),
  );
  const [thinkingContent, setThinkingContent] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (message.reasoning) {
        setThinkBlocks([message.reasoning]);
      }

      setDisplayContent(message.content);
      setIsThinking(!!message.reasoning && message.content.length == 0);
    });
  }, [message]);

  const renderCodeBlock = (node: any) => {
    const blockId = `${node.content}-${index}`;

    const handleToggleExpand = () => {
      setExpandedCodeBlocks((prev) => {
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
      title: "Message copied to clipboard",
      description: "",
    });
  };

  const handleToggleThinkBlock = () => {
    setExpandedThinkBlocks((prev) => {
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
    <View className={`flex flex-row ${isFromUser ? "justify-end" : "justify-start"} mb-2`}>
      <View className={`flex-col w-full`}>
      {message.toolCalls && message.toolCalls.length > 0 && (
            <View className="flex-row flex-wrap mt-1 mb-2">
              {message.toolCalls.map((toolCall, idx) => (
                <ToolCallIndicator
                  key={`${index}-${idx}`}
                  toolCall={toolCall}
                  isDark={isDark}
                />
              ))}
            </View>
          )}
      <View className="flex flex-row">
      {
        message.mentionedDocumentIds && message.mentionedDocumentIds.length > 0 && (
          <View className="flex-row flex-wrap mt-1 mb-2">
            {message.mentionedDocumentIds.map((documentId) => (
              <MentionedDocument documentId={documentId} />
            ))}
          </View>
        )
      }
      </View>
    
    <View className={`flex flex-row ${isFromUser ? "justify-end" : "justify-start"}`}>
      
      {!isFromUser && displayContent.length == 0 && isGenerating && (
        <View className="relative">
          <View className="bg-surface border border-border w-10 h-10 rounded-full items-center justify-center shadow-md">
            <Ionicons
              name="compass"
              size={24}
              className={`${Platform.OS === "web" ? "animate-spin duration-[2000ms]" : ""} !text-primary`}
            />
          </View>
        </View>
      )}
      {(displayContent.length > 0 || isThinking) && (
        <View
          className={`relative px-4 py-2 mb-4 rounded-2xl max-w-[100%] ${
            isFromUser ? "bg-primary rounded-tr-none" : "rounded-tl-none"
          } ${editingMessageIndex === index ? "bg-yellow-500" : ""}`}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {editingMessageIndex === index && (
            <Text className="text-yellow-400 text-xs mb-1">Editing...</Text>
          )}
          {!(isFromUser) && modelUsed && (
            <Text className="text-xs opacity-50 mb-1 text-text">
              via {modelUsed.id}
            </Text>
          )}
          
          {editingMessageIndex !== index && (
            <View>
              {true &&
                thinkBlocks.map((thinkContent, thinkIndex) => (
                  <ThinkBlock
                    key={`think-${index}-${thinkIndex}`}
                    content={thinkContent}
                    isDark={isDark}
                    style={markdownStyles.code_block}
                    isExpanded={expandedThinkBlocks.has(
                      `think-${index}-${thinkIndex}`,
                    )}
                    onToggleExpand={() => {
                      setExpandedThinkBlocks((prev) => {
                        const newSet = new Set(prev);
                        const blockId = `think-${index}-${thinkIndex}`;
                        if (newSet.has(blockId)) {
                          newSet.delete(blockId);
                        } else {
                          newSet.add(blockId);
                        }
                        return newSet;
                      });
                    }}
                  />
                ))}
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
              isUser={isFromUser}
              hasPreviewableCode={hasPreviewableCode}
              onCopy={handleCopyMessage}
              onPreviewCode={onPreviewCode}
              onEdit={() => onEdit?.(index)}
            />
          )}
        </View>
      )}
    </View>
    </View>
    </View>
  );
};
