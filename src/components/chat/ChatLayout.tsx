import React, { useRef, useState, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useAtom } from 'jotai';
import { useWindowDimensions } from 'react-native';
import { previewCodeAtom, sidebarVisibleAtom } from '@/src/hooks/atoms';
import { Modal } from '@/src/components/ui/Modal';
import { CodePreview } from '@/src/components/chat/CodePreview';
import { Platform } from '@/src/utils/platform';
import { ChatThreads } from './ChatThreads';
import { SectionHeader } from '../ui/SectionHeader';
import { useLocalization } from '@/src/hooks/useLocalization';

export const ChatLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previewCode, setPreviewCode] = useAtom(previewCodeAtom);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.isDesktop && width >= 768;
  const [isSidebarVisible, setIsSidebarVisible] = useAtom(sidebarVisibleAtom);
  const { t } = useLocalization();

  const sidebarToggle = () => (
    <TouchableOpacity onPress={()=>setIsSidebarVisible(!isSidebarVisible)} className='my-2 p-4 bg-surface rounded-full'>
          <SectionHeader
          title={t('chats.chats')}
          icon="chatbubbles"
          className=''
        />
        </TouchableOpacity>
  )

  const handleSidebarToggle = () => {
    setIsSidebarVisible(!isSidebarVisible);
  }

  return (
    <View className="flex-row flex-1">
      <View className="flex-1 flex-row">
          {isDesktop && isSidebarVisible &&
            <ChatThreads className="border-r-2 border-border overflow-hidden" isSidebarVisible={isSidebarVisible} setIsSidebarVisible={handleSidebarToggle} />}

          {isDesktop && !isSidebarVisible && <View className='group absolute left-0 my-auto z-1 flex flex-col'>
            {sidebarToggle()}
            <ChatThreads className="transition-all duration-200 bg-surface rounded-xl group-hover:w-64 group-hover:h-[70%] h-0 border-r-2 border-border overflow-hidden" isSidebarVisible={isSidebarVisible} setIsSidebarVisible={handleSidebarToggle} />
            </View>}
        <View className="flex-1">
          {children}
        </View>
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