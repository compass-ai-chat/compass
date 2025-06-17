import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAtomValue } from 'jotai';
import { fontPreferencesAtom } from '@/src/hooks/atoms';
import WebView from 'react-native-webview';
import { Document } from '@/src/types/core';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
}) => {
  const { colorScheme } = useColorScheme();
  const preferences = useAtomValue(fontPreferencesAtom);
  const isDark = colorScheme === 'dark';
  const [showRaw, setShowRaw] = useState(false);

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
    if (Platform.OS === 'web') {
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

  const canToggleView = document.type === 'text' || document.type === 'note';

  return (
    <View className="flex-1 bg-surface rounded-lg p-4 shadow-lg">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-semibold text-text">{document.name}</Text>
        <View className="flex-row gap-2">
          {canToggleView && (
            <View className="flex-row bg-background rounded-full">
              <TouchableOpacity 
                onPress={() => setShowRaw(false)}
                className={`px-3 py-1 rounded-full hover:opacity-70 ${!showRaw ? 'bg-primary' : 'bg-transparent'}`}
              >
                <Ionicons 
                  name="document-text" 
                  size={24} 
                  className={`${!showRaw ? 'text-white' : 'text-text'}`} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowRaw(true)}
                className={`px-3 py-1 rounded-full hover:opacity-70 ${showRaw ? 'bg-primary' : 'bg-transparent'}`}
              >
                <Ionicons 
                  name="code-slash" 
                  size={24} 
                  className={`${showRaw ? 'text-white' : 'text-text'}`} 
                />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity 
            onPress={onClose}
            className="p-2 hover:bg-surface rounded-full"
          >
            <Ionicons name="close" size={24} className="text-text" />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderContent()}
    </View>
  );
}; 