import React, { useRef, useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useAtom } from 'jotai';
import { useWindowDimensions } from 'react-native';
import { previewCodeAtom } from '@/src/hooks/atoms';
import { Modal } from '@/src/components/ui/Modal';
import { CodePreview } from '@/src/components/chat/CodePreview';
import { ThreadsSidebar } from '@/src/components/web/ThreadsSidebar';

export const ChatLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previewCode, setPreviewCode] = useAtom(previewCodeAtom);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <View className="flex-row flex-1">
      <View className="flex-1 bg-background">
        <ThreadsSidebar />
        {children}
      </View>
      
      {previewCode && (
        isDesktop ? (
          <View className="flex-1 p-4 overflow-hidden w-1/3 h-screen">
            <CodePreview {...previewCode} onClose={() => setPreviewCode(null)} />
          </View>
        ) : (
          <Modal isVisible={!!previewCode} onClose={() => setPreviewCode(null)}>
            <View className="flex-1">
              <CodePreview {...previewCode} onClose={() => setPreviewCode(null)} />
            </View>
          </Modal>
        )
      )}
    </View>
  );
}; 