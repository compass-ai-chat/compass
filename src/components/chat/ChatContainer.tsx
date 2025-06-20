import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, FlatList, Platform } from 'react-native';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { ChatInput, ChatInputRef, MentionedCharacter } from './ChatInput';
import { MessageList, MessageListRef } from './MessageList';
import { ChatMessage } from '@/src/types/core';
import { useChat } from '@/src/hooks/useChat';

interface ChatContainerProps {
  messages: ChatMessage[];
  onSend: (message: string, mentionedCharacters: MentionedCharacter[]) => Promise<void>;
  isGenerating: boolean;
  onInterrupt: () => void;
  onMessagePress: (index: number, message: ChatMessage) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSend,
  isGenerating,
  onInterrupt,
  onMessagePress
}) => {
  const { currentThread } = useChat();
  const messageListRef = useRef<MessageListRef>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const previousThreadId = useRef(currentThread.id);

  useEffect(() => {
    chatInputRef.current?.focus();
  }, [currentThread.id])

  // All scroll-related logic here...
  const scrollToEnd = useCallback(() => {
    messageListRef.current?.scrollToEnd();
    setUserHasScrolled(false);
    setShowScrollButton(false);
  }, []);

  const debouncedScrollToEnd = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
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

  return (
    <View className={`mx-auto flex-1 ${Platform.OS == 'web' ? 'w-[80%]' : 'w-full'}`}>
      <MessageList
        ref={messageListRef}
        messages={messages}
        onMessagePress={onMessagePress}
        onScroll={handleScroll}
        onScrollBeginDrag={() => setUserHasScrolled(true)}
        onContentSizeChange={() => {
          if (messages.length > 0 && !userHasScrolled) {
            debouncedScrollToEnd();
          }
        }}
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
      />
    </View>
  );
}; 