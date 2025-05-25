import React, { useRef } from 'react';
import { FlatList } from 'react-native';
import { useAtom } from 'jotai';
import { previewCodeAtom } from '@/src/hooks/atoms';
import { parseCodeBlocks } from '@/src/utils/codeParser';
import { Message } from './Message';
import { ChatMessage } from '@/src/types/core';

interface MessageListProps {
  messages: ChatMessage[];
  onMessagePress: (index: number, message: ChatMessage) => void;
  onScroll: (event: any) => void;
  onScrollBeginDrag: () => void;
  onContentSizeChange: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMessagePress,
  onScroll,
  onScrollBeginDrag,
  onContentSizeChange
}) => {
  const flatListRef = useRef<FlatList<any>>(null);
  const [previewCode, setPreviewCode] = useAtom(previewCodeAtom);

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
      contentContainerStyle={{ padding: 16, paddingBottom: 50, paddingTop: 50 }}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
    />
  );
}; 