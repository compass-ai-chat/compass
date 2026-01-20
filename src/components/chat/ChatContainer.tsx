import React, { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, Platform } from 'react-native';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { ChatInput, ChatInputRef, MentionedCharacter } from './ChatInput';
import { MessageList, MessageListRef } from './MessageList';
import { ChatMessage, Document } from '@/src/types/core';
import { useAtomValue } from 'jotai';
import { userDocumentsAtom } from '@/src/hooks/atoms';

interface ChatContainerProps {
  messages: ChatMessage[];
  threadId: string;
  threadDocumentIds?: string[];
  onSend: (message: string, mentionedCharacters: MentionedCharacter[], mentionedDocuments: Document[], images?: string[]) => void;
  isGenerating: boolean;
  onInterrupt: () => void;
  onMessagePress: (index: number, message: ChatMessage) => void;
}

const ChatContainerComponent: React.FC<ChatContainerProps> = ({
  messages,
  threadId,
  threadDocumentIds,
  onSend,
  isGenerating,
  onInterrupt,
  onMessagePress
}) => {
  const userDocuments = useAtomValue(userDocumentsAtom);
  const messageListRef = useRef<MessageListRef>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Get initial mentioned documents from thread metadata
  const initialMentionedDocuments = useMemo(() => {
    const documentIds = threadDocumentIds || [];
    return userDocuments.filter(doc => documentIds.includes(doc.id));
  }, [threadDocumentIds, userDocuments]);

  useEffect(() => {
    chatInputRef.current?.focus();
  }, [threadId])

  // All scroll-related logic here...
  const scrollToEnd = useCallback(() => {
    messageListRef.current?.scrollToEnd();
    setUserHasScrolled(false);
    setShowScrollButton(false);
  }, []);

  const debouncedScrollToEnd = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(scrollToEnd, 300);
      };
    })(),
    [scrollToEnd]
  );

  const handleScroll = useCallback((event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const maxOffset = event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height;
    
    const hasScrolledUp = maxOffset - currentOffset > 50;
    setUserHasScrolled(hasScrolledUp);
    setShowScrollButton(hasScrolledUp);
  }, []);

  const handleScrollBeginDrag = useCallback(() => setUserHasScrolled(true), []);
  
  const handleContentSizeChange = useCallback(() => {
    if (messages.length > 0 && !userHasScrolled) {
      debouncedScrollToEnd();
    }
  }, [messages.length, userHasScrolled, debouncedScrollToEnd]);

  return (
    <View className={`mx-auto flex-1 ${Platform.OS == 'web' ? 'w-[80%]' : 'w-full'}`}>
      <MessageList
        ref={messageListRef}
        messages={messages}
        onMessagePress={onMessagePress}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onContentSizeChange={handleContentSizeChange}
      />
      
      <ScrollToBottomButton
        visible={showScrollButton}
        onPress={scrollToEnd}
      />
      
      <ChatInput 
        ref={chatInputRef}
        onSend={onSend} 
        isGenerating={isGenerating}
        onInterrupt={onInterrupt}
        className={`${Platform.OS == 'web' ? 'mb-8 rounded-xl' : ''}`}
        initialInputRows={Platform.OS == 'web' ? 3 : 1}
        initialMentionedDocuments={initialMentionedDocuments}
      />
    </View>
  );
};

export const ChatContainer = memo(ChatContainerComponent); 