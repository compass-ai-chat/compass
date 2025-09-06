import React, { useCallback, useMemo, useState, memo } from "react";
import {
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Text,
  Clipboard,
  Image,
  Modal
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useColorScheme } from "nativewind";
import { Character, ChatMessage } from "@/src/types/core";
import {
  editingMessageIndexAtom,
  fontPreferencesAtom,
  isGeneratingAtom,
} from "@/src/hooks/atoms";
import { useAtomValue } from "jotai";
import { toastService } from "@/src/services/toastService";
import { Ionicons } from "@expo/vector-icons";
import { MessageActions } from "./MessageActions";
import { ThinkBlock } from "./ThinkBlock";
import { ToolCall } from "@/src/services/chat/providers/VercelAIProvider";
import { MentionedDocument } from "./MentionedDocument";
import { format } from "date-fns";
import { ImageInfo, ImagePreview, ImagePreviewProps } from "../image/ImagePreview";
import { useTools } from "@/src/hooks/useTools";
import { IconComponent } from "@/src/components/common/iconHelpers";

interface MessageProps {
  message: ChatMessage;
  content: string;
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
  const handleCopy = useCallback(() => {
    Clipboard.setString(content);
    toastService.success({ title: "Copied to clipboard", description: "" });
  }, [content]);

  return (
    <View style={style} className="border-border border mb-4">
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={onToggleExpand} className="mr-2 p-1 flex-row items-center">
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={16}
            color={isDark ? "#fff" : "#000"}
          />
          {sourceInfo && (
            <Text className="pl-2 text-md pt-1 text-text opacity-50">Generated {sourceInfo} code </Text>
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

const ToolCallIndicator: React.FC<ToolCallIndicatorProps> = ({ toolCall, isDark }) => {
  const [isHovered, setIsHovered] = useState(false);
  const statusText = toolCall?.status;
  const { getIcon } = useTools();

  // Get the proper icon for the tool
  const toolIcon = toolCall?.toolName ? getIcon(toolCall.toolName) : 'code';

  return (
    <View
      className="mr-2 mb-2 flex-row items-center"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <View
        className={`bg-surface border border-border rounded-full px-3 py-2 flex-row items-center transition-all duration-300 ease-in-out shadow-sm ${
          toolCall?.pending 
            ? "animate-pulse border-primary/30" 
            : "hover:border-primary/50 hover:shadow-md"
        }`}
      >
        {toolCall?.pending ? (
          <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
        ) : (
          <IconComponent
            iconName={toolIcon}
            className="!text-primary opacity-80"
            size={16}
          />
        )}
        <Text
          className={`text-text text-sm font-medium transition-all duration-300 ease-in-out overflow-hidden ${
            isHovered || toolCall?.pending ? "opacity-100 ml-2 max-w-64" : "opacity-0 max-w-0"
          }`}
          numberOfLines={1}
        >
          {statusText}
        </Text>
      </View>
    </View>
  );
};

const ImageResult: React.FC<{image:any}> = ({image}) => {
  const copyImageToClipboard = async () => {
    if (image?.data?.imagePath) {
      const response = await fetch(image.data.imagePath);
      const blob = await response.blob();
      navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    }
  };

  return (
    <div className="w-[50%] relative border border-white rounded-lg">
      <Image
        source={{ uri: image?.data?.imagePath }}
        className="aspect-square rounded-lg"
        resizeMode="cover"
      />
      <div className="p-3 absolute bottom-0 w-full flex flex-row bg-background opacity-[90%] rounded-lg">
        <View>
        <Text className="text-xs text-gray-500 mb-2">
          {image?.data?.date??"Sometime today"}
        </Text>
        <Text className="text-sm text-text" numberOfLines={3}>
          {image?.data?.title??"A happy clown swimming in a pond"}
        </Text>
        </View>
        <button
          onClick={copyImageToClipboard}
          className="mt-2 px-4 py-2 bg-surface text-primary rounded ms-auto"
        >
          Copy
        </button>
      </div>
    </div>
  )
}

const MessageComponent: React.FC<MessageProps> = ({
  message,
  content,
  character,
  index,
  onEdit,
  onPreviewCode,
  hasPreviewableCode,
  modelUsed,
}) => {
  const { colorScheme } = useColorScheme();
  const preferences = useAtomValue(fontPreferencesAtom);
  const editingMessageIndex = useAtomValue(editingMessageIndexAtom);
  const isGenerating = useAtomValue(isGeneratingAtom);

  const isDark = colorScheme === "dark";
  const isFromUser = message.role === "user";
  const showThinking = Boolean(message.reasoning) && message.content.length === 0;

  let imageInfo: ImageInfo | undefined;

  const imageResult = message.toolCalls?.find(x=>!!x.result?.data?.imagePath)?.result;
  if(imageResult){
    imageInfo = {
      date: imageResult?.data?.date??"Example date",
      title: imageResult?.data?.prompt??"Example prompt",
      path: imageResult?.data?.imagePath
    }
  }

  const markdownStyles = useMemo(
    () => ({
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
    }), [isFromUser, isDark, preferences.fontFamily, preferences.fontSize, preferences.lineHeight, preferences.letterSpacing]
  );

  const [isHovered, setIsHovered] = useState(false);
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<string>>(new Set());
  const [expandedThinkBlocks, setExpandedThinkBlocks] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCopyMessage = useCallback(() => {
    Clipboard.setString(content);
    toastService.success({ title: "Message copied to clipboard", description: "" });
  }, [content]);

  const renderCodeBlock = useCallback(
    (node: any) => {
      const blockId = `${node.content}-${index}`;
      const handleToggleExpand = () => {
        setExpandedCodeBlocks(prev => {
          const newSet = new Set(prev);
          if (newSet.has(blockId)) newSet.delete(blockId);
          else newSet.add(blockId);
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
    },
    [expandedCodeBlocks, index, isDark, markdownStyles.code_block]
  );

  return (
    <View className={`flex flex-row ${isFromUser ? "justify-end" : "justify-start"} mb-2`}>
      <View className="flex-col w-full">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <View className="flex-row flex-wrap mt-1 mb-2">
            {message.toolCalls.map((toolCall, idx) => (
              <ToolCallIndicator key={`${index}-${idx}`} toolCall={toolCall} isDark={isDark} />
            ))}
          </View>
        )}

        <View className="flex flex-row ms-auto">
          {message.mentionedDocumentIds && message.mentionedDocumentIds.length > 0 && (
            <View className="flex-row flex-wrap mt-1 mb-2">
              {message.mentionedDocumentIds.map(documentId => (
                <MentionedDocument key={documentId} documentId={documentId} />
              ))}
            </View>
          )}
        </View>

        <View className={`flex flex-row ${isFromUser ? "justify-end" : "justify-start"}`}>
          {!isFromUser && message.content.length === 0 && isGenerating && (
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

          {(message.content.length > 0 || showThinking || (message.images && message.images.length > 0)) && (
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

              {!isFromUser && modelUsed && (
                <Text className="text-xs opacity-50 mb-1 text-text">via {modelUsed.id}</Text>
              )}

              {editingMessageIndex !== index && (
                <View>
                  {message.reasoning && (
                    <ThinkBlock
                      key={`think-${index}-0`}
                      content={message.reasoning}
                      isDark={isDark}
                      style={markdownStyles.code_block}
                      isExpanded={expandedThinkBlocks.has(`think-${index}-0`)}
                      onToggleExpand={() => {
                        setExpandedThinkBlocks(prev => {
                          const newSet = new Set(prev);
                          const blockId = `think-${index}-0`;
                          if (newSet.has(blockId)) newSet.delete(blockId);
                          else newSet.add(blockId);
                          return newSet;
                        });
                      }}
                    />
                  )}

                  {/* Display user images */}
                  {message.images && message.images.length > 0 && (
                    <View className="mb-2">
                      <View className="flex-row flex-wrap">
                        {message.images.map((image, idx) => (
                          <TouchableOpacity 
                            key={idx}
                            onPress={() => setSelectedImage(image)}
                          >
                            <Image
                              source={{ uri: image }}
                              className="w-32 h-32 rounded-lg mr-2 mb-2 border border-border"
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {message.content && (
                    <Markdown
                      style={markdownStyles}
                      rules={{
                        fence: renderCodeBlock,
                        code_block: renderCodeBlock,
                      }}
                    >
                      {message.content}
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
        {imageInfo && (<ImagePreview image={imageInfo!} className="w-[50%]" />)}

                {/* Image Modal for full view */}
        {Platform.OS === 'web' ? (
          selectedImage && (
            <TouchableOpacity 
              className="fixed inset-0 bg-black/80 items-center justify-center z-50"
              onPress={() => setSelectedImage(null)}
            >
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-[90%] max-h-[90%] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </TouchableOpacity>
          )
        ) : (
          selectedImage && (
            <Modal
              visible={!!selectedImage}
              transparent={true}
              onRequestClose={() => setSelectedImage(null)}
            >
              <TouchableOpacity 
                className="flex-1 bg-black/80 items-center justify-center"
                onPress={() => setSelectedImage(null)}
              >
                <TouchableOpacity activeOpacity={1}>
                  <Image
                    source={{ uri: selectedImage }}
                    className="max-w-[90%] max-h-[90%]"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )
        )}
      </View>
    </View>
  );
};

export const Message = memo(MessageComponent);
