import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { Modal } from '../ui/Modal';

interface CodePreviewProps {
  html?: string;
  css?: string;
  javascript?: string;
  onClose: () => void;
}

const ToggleButtons: React.FC<{
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
}> = ({ showPreview, setShowPreview }) => (
  <View className="flex-row bg-surface rounded-full">
    <TouchableOpacity 
      onPress={() => setShowPreview(true)}
      className={`px-3 py-1 rounded-full hover:opacity-70 ${showPreview ? 'bg-primary' : 'bg-transparent'}`}
    >
      <Text className={`${showPreview ? 'text-white' : 'text-text'}`}>Preview</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={() => setShowPreview(false)}
      className={`px-3 py-1 rounded-full hover:opacity-70 ${!showPreview ? 'bg-primary' : 'bg-transparent'}`}
    >
      <Text className={`${!showPreview ? 'text-white' : 'text-text'}`}>Code</Text>
    </TouchableOpacity>
  </View>
);

const Header: React.FC<{
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  onClose: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen: () => void;
}> = ({ showPreview, setShowPreview, onClose, isFullscreen, onToggleFullscreen }) => (
  <View className="flex-row justify-between items-center p-2 bg-background border-b border-border rounded-lg">
    <ToggleButtons showPreview={showPreview} setShowPreview={setShowPreview} />
    <View className="flex-row items-center gap-2">
      <TouchableOpacity onPress={onToggleFullscreen}>
        <Ionicons 
          name={isFullscreen ? "contract" : "expand"} 
          size={24} 
          className="text-text rounded-full hover:opacity-70" 
        />
      </TouchableOpacity>
      {!isFullscreen && (
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} className="text-text rounded-full hover:opacity-70" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export const CodePreview: React.FC<CodePreviewProps> = ({
  html = '',
  css = '',
  javascript = '',
  onClose
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const combinedContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          ${javascript}
        </script>
      </body>
    </html>
  `;

  const codeContent = `// HTML
${html}

// CSS
${css}

// JavaScript
${javascript}`;

  const previewContent = (
    <>
      {showPreview ? (
        Platform.OS === 'web' ? (
          <iframe
            srcDoc={combinedContent}
            className="flex-1 w-full h-full border-none"
            sandbox="allow-scripts"
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: combinedContent }}
            className="flex-1"
            originWhitelist={['*']}
          />
        )
      ) : (
        <View className="flex-1">
          <ScrollView className="flex-1">
            <Text className="text-text p-2" style={{ fontFamily: 'monospace' }}>
              {codeContent}
            </Text>
          </ScrollView>
        </View>
      )}
    </>
  );

  return (
    <>
      <View className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden flex-1">
        <Header 
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          onClose={onClose}
          onToggleFullscreen={() => setIsFullscreen(true)}
        />
        {previewContent}
      </View>

      <Modal 
        isVisible={isFullscreen} 
        onClose={() => setIsFullscreen(false)}
        maxHeight="100%"
        className="flex-1 m-2 rounded-lg max-h-full"
      >
        <View className="flex-1 rounded-lg">
          <Header 
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            onClose={onClose}
            isFullscreen={true}
            onToggleFullscreen={() => setIsFullscreen(false)}
          />
          {previewContent}
        </View>
      </Modal>
    </>
  );
}; 