import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, useWindowDimensions, Text, Share, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/src/components/ui/Modal';
import { Document } from '@/src/types/core';
import { toastService } from '@/src/services/toastService';
import { useLocalization } from '@/src/hooks/useLocalization';
import { useResponsiveStyles } from '@/src/hooks/useResponsiveStyles';
import { Platform } from '@/src/utils/platform';
import Markdown from 'react-native-markdown-display';
import { useColorScheme } from 'nativewind';
import { useAtomValue } from 'jotai';
import { fontPreferencesAtom } from '@/src/hooks/atoms';
import WebView from 'react-native-webview';

interface DocumentPreviewModalProps {
  isVisible: boolean;
  document: Document | null;
  onClose: () => void;
  onStartChat?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  showActions?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isVisible,
  document,
  onClose,
  onStartChat,
  onDelete,
  showActions = true,
}) => {
  const { t } = useLocalization();
  const { width } = useWindowDimensions();
  const { getResponsiveSize } = useResponsiveStyles();
  const isMobile = width < 768;
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const { colorScheme } = useColorScheme();
  const preferences = useAtomValue(fontPreferencesAtom);
  const isDark = colorScheme === 'dark';

  if (!document) return null;

  // Keyboard shortcuts
  useEffect(() => {
    if (!isVisible || !Platform.isWeb) return;

    
  }, [isVisible, showRaw, onClose, onStartChat]);

  const canToggleView = document.type === 'text' || document.type === 'note';

  const markdownStyles = {
    body: {
      color: isDark ? '#fff' : '#1f2937',
      fontFamily: preferences.fontFamily,
      fontSize: preferences.fontSize,
      lineHeight: preferences.lineHeight,
      letterSpacing: preferences.letterSpacing
    },
    heading1: {
      fontSize: preferences.fontSize * 1.5,
      fontWeight: 'bold',
      marginVertical: 10,
    },
    heading2: {
      fontSize: preferences.fontSize * 1.3,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    list_item: {
      marginVertical: 4,
    },
  };

  const renderPDFViewer = (pdfUri: string) => {
    if (Platform.isWeb) {
      return (
        <iframe
          src={`${pdfUri}#toolbar=0`}
          className="w-full h-full border-none"
          style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
        />
      );
    } else {
      return (
        <WebView
          source={{ uri: pdfUri }}
          style={{ flex: 1 }}
          className="bg-surface rounded-lg"
        />
      );
    }
  };

  const renderContent = () => {
    switch (document.type) {
      case 'pdf':
        if (!document.path) return <Text className="text-text">PDF path not found</Text>;
        return renderPDFViewer(document.path);
      
      case 'text':
      case 'note':
        if (!document.content && !document.chunks?.length) {
          return <Text className="text-text">No content available</Text>;
        }
        
        return (
          <ScrollView className="flex-1 bg-surface rounded-lg p-4">
            {showRaw ? (
              <Text className="text-text font-mono">{document.content || document.chunks?.join('\n')}</Text>
            ) : (
              <Markdown style={markdownStyles}>
                {document.content || document.chunks?.join('\n') || ''}
              </Markdown>
            )}
          </ScrollView>
        );
      
      default:
        return <Text className="text-text">Unsupported document type</Text>;
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.isWeb) {
        if (navigator.share) {
          await navigator.share({
            title: document.name,
            text: document.content || 'Document from Compass',
            url: window.location.href,
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(document.content || '');
          toastService.success({ 
            title: "Copied to clipboard", 
            description: "Document content copied" 
          });
        }
      } else {
        await Share.share({
          title: document.name,
          message: document.content || 'Document from Compass',
        });
      }
    } catch (error) {
      // User cancelled sharing
    }
  };

  const handleStartChat = () => {
    if (onStartChat && document) {
      onStartChat(document);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && document) {
      onDelete(document);
      onClose();
    }
  };

  const quickActions = [
    {
      icon: 'chatbubble-ellipses',
      label: 'Start Chat',
      action: handleStartChat,
      visible: !!onStartChat,
      color: 'bg-primary',
    },
    {
      icon: 'share',
      label: 'Share',
      action: handleShare,
      visible: true,
      color: 'bg-blue-500',
    },
    {
      icon: 'trash',
      label: 'Delete',
      action: handleDelete,
      visible: !!onDelete,
      color: 'bg-red-500',
    },
  ].filter(action => action.visible);

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      maxHeight="95%"
      className={`w-2/3 h-full ${isMobile ? "m-2" : "m-8"}`}
    >
      <View className="flex-1 bg-background rounded-lg overflow-hidden">
        {/* Header with document info and actions */}
        <View className="bg-surface border-b border-border p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-xl font-semibold text-text" numberOfLines={1}>
                {document.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons 
                  name={document.type === 'pdf' ? 'document' : 'document-text'} 
                  size={16} 
                  className="!text-secondary mr-2" 
                />
                <Text className="text-secondary text-sm">
                  {document.type.toUpperCase()} • {document.pages || 1} pages
                </Text>
                {document.metadata?.size && (
                  <Text className="text-secondary text-sm ml-2">
                    • {(document.metadata.size / 1024).toFixed(1)} KB
                  </Text>
                )}
              </View>
            </View>
            
            <View className="flex-row items-center">
              {canToggleView && (
                <View className="flex-row bg-background rounded-full mr-2">
                  <TouchableOpacity 
                    onPress={() => setShowRaw(false)}
                    className={`px-3 py-1 rounded-full hover:opacity-70 ${!showRaw ? 'bg-primary' : 'bg-transparent'}`}
                    accessibilityLabel="View formatted content"
                    accessibilityHint="Shows the document in formatted view"
                  >
                    <Ionicons 
                      name="document-text" 
                      size={20} 
                      className={`${!showRaw ? '!text-white' : '!text-text'}`} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowRaw(true)}
                    className={`px-3 py-1 rounded-full hover:opacity-70 ${showRaw ? 'bg-primary' : 'bg-transparent'}`}
                    accessibilityLabel="View raw content"
                    accessibilityHint="Shows the document in raw text format"
                  >
                    <Ionicons 
                      name="code-slash" 
                      size={20} 
                      className={`${showRaw ? '!text-white' : '!text-text'}`} 
                    />
                  </TouchableOpacity>
                </View>
              )}

              {false && showActions && (
                <TouchableOpacity
                  onPress={() => setIsActionsVisible(!isActionsVisible)}
                  className="p-2 mr-2 bg-background rounded-full border border-border"
                  accessibilityLabel={isActionsVisible ? "Hide actions" : "Show actions"}
                  accessibilityHint="Toggle document action buttons"
                >
                  <Ionicons 
                    name="ellipsis-horizontal" 
                    size={getResponsiveSize(20, 24)} 
                    className="!text-text" 
                  />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={onClose}
                className="p-2 bg-background rounded-full border border-border"
                accessibilityLabel="Close document preview"
                accessibilityHint="Press Escape to close"
              >
                <Ionicons 
                  name="close" 
                  size={getResponsiveSize(20, 24)} 
                  className="!text-text" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          {showActions && isActionsVisible && (
            <View className="mt-3 pt-3 border-t border-border">
              <View className="flex-row gap-2 mb-2">
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={action.action}
                    className={`flex-row items-center px-3 py-2 rounded-lg ${action.color} hover:opacity-80`}
                    accessibilityLabel={action.label}
                    accessibilityHint={`${action.label} this document`}
                  >
                    <Ionicons 
                      name={action.icon as any} 
                      size={16} 
                      className="!text-white mr-2" 
                    />
                    <Text className="text-white text-sm font-medium">
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {Platform.isWeb && (
                <View className="flex-row flex-wrap gap-2 text-xs text-secondary opacity-70">
                  <Text className="text-xs text-secondary">Shortcuts:</Text>
                  <Text className="text-xs text-secondary">Esc: Close</Text>
                  {canToggleView && <Text className="text-xs text-secondary">⌘+R: Toggle view</Text>}
                  <Text className="text-xs text-secondary">⌘+S: Share</Text>
                  {onStartChat && <Text className="text-xs text-secondary">⌘+⇧+C: Start chat</Text>}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Document Viewer */}
        <View className="flex-1">
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};
