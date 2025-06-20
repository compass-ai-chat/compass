import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { FlatList } from 'react-native';
import { useAtom } from 'jotai';
import { previewCodeAtom } from '@/src/hooks/atoms';
import { parseCodeBlocks } from '@/src/utils/codeParser';
import { Message } from './Message';
import { ChatMessage } from '@/src/types/core';

export interface MessageListRef {
  scrollToEnd: () => void;
}

interface MessageListProps {
  messages: ChatMessage[];
  onMessagePress: (index: number, message: ChatMessage) => void;
  onScroll: (event: any) => void;
  onScrollBeginDrag: () => void;
  onContentSizeChange: () => void;
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>(({
  messages,
  onMessagePress,
  onScroll,
  onScrollBeginDrag,
  onContentSizeChange
}, ref) => {
  const flatListRef = useRef<FlatList<any>>(null);
  const [previewCode, setPreviewCode] = useAtom(previewCodeAtom);

  useImperativeHandle(ref, () => ({
    scrollToEnd: () => {
      flatListRef.current?.scrollToOffset({ offset: 99999999, animated: true });
    }
  }));

  const renderItem = ({ item: message, index }: { item: any; index: number }) => {
    const parsedCode = !message.isUser ? parseCodeBlocks(message.content) : null;

    return (
      <Message
        content={message.content}
        isUser={message.isUser}
        character={message.character}
        index={index}
        onEdit={() => onMessagePress(index, message)}
        onPreviewCode={() => parsedCode && setPreviewCode(parsedCode)}
        hasPreviewableCode={!!parsedCode}
      />
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      onContentSizeChange={onContentSizeChange}
      keyExtractor={(_, index) => index.toString()}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10
      }}
      className="flex-1 -mt-4"
      contentContainerStyle={{ padding: 16, paddingBottom: 50, paddingTop: 100 }}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
    />
  );
}); 