import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { ChatInput, ChatInputRef } from './ChatInput';
import { useChat } from '@/src/hooks/useChat';
import { useCharacterModelSelection } from '@/src/hooks/useCharacterModelSelection';
import { ChatTopbar } from './ChatTopbar';
import { DropdownElement } from '../ui/Dropdown';
import { ChatLayout } from './ChatLayout';
import { EmptyChatState } from './EmptyChatState';
import { ChatContainer } from './ChatContainer';
import { useModelDownloadStatus } from '@/src/hooks/useModelDownloadStatus';
import { useAtomValue } from 'jotai';
import { streamingMessageAtom } from '@/src/hooks/atoms';

export const ChatThread: React.FC = () => {
  const {
    currentThread,
    isGenerating,
    wrappedHandleSend,
    handleMessagePress,
    handleInterrupt,
    setIsGenerating
  } = useChat();

  const streamingMessage = useAtomValue(streamingMessageAtom);

  const {
    selectedModel,
    selectedCharacter,
    models,
    characters,
    handleModelSelection,
    handleCharacterSelection,
  } = useCharacterModelSelection();

  // Add the model download status hook
  useModelDownloadStatus();

  const chatInputRef = useRef<ChatInputRef>(null);
  const previousThreadId = useRef(currentThread.id);
  const [selectedElement, setSelectedElement] = useState<DropdownElement | undefined>();

  useEffect(() => {
    chatInputRef.current?.focus();
    if (previousThreadId.current !== currentThread.id) {
      previousThreadId.current = currentThread.id;
      setIsGenerating(false);
    }
  }, [currentThread.id]);

  const baseMessages = currentThread?.messages || [];
  
  // Merge streaming message content with base messages for real-time updates
  const messages = useMemo(() => {
    if (!streamingMessage || streamingMessage.threadId !== currentThread?.id) {
      return baseMessages;
    }
    
    // Clone messages and update the streaming message with latest content
    const merged = [...baseMessages];
    if (merged[streamingMessage.index]) {
      merged[streamingMessage.index] = {
        ...merged[streamingMessage.index],
        content: streamingMessage.content,
        reasoning: streamingMessage.reasoning,
        toolCalls: streamingMessage.toolCalls,
      };
    }
    return merged;
  }, [baseMessages, streamingMessage, currentThread?.id]);
  
  const isEmpty = messages.length === 0;

  // Create dropdown elements directly
  const dropdownElements: DropdownElement[] = useMemo(() => [
    ...models.map(model => ({
      id: model.id,
      title: model.name,
      logo: model.provider.logo,
      metadata: { type: 'model' as const, data: model }
    })),
    ...characters.map(character => ({
      id: character.id,
      title: character.name,
      image: character.image || character.icon,
      logo: character.icon,
      metadata: { type: 'character' as const, data: character }
    })),
  ], [models, characters]);

  useEffect(()=>{
    setSelectedElement(selectedCharacter 
      ? dropdownElements.find(el => el.id === selectedCharacter.id)
      : dropdownElements.find(el => el.id === selectedModel?.id) ?? dropdownElements.find(x=>true))
  }, [dropdownElements, selectedCharacter, selectedModel])

  // const selectedElement = selectedCharacter 
  //   ? dropdownElements.find(el => el.id === selectedCharacter.id)
  //   : dropdownElements.find(el => el.id === selectedModel?.id);

  const handleSelection = (element: DropdownElement) => {
    const { type, data } = element.metadata;
    
    if (type === 'model') {
      handleModelSelection(data);
    } else {
      handleCharacterSelection(data);
    }
  };

  return (
    <ChatLayout>
      <ChatTopbar 
        dropdownElements={dropdownElements}
        selectedElement={selectedElement}
        onSelection={handleSelection}
      />
      
      {isEmpty ? (
        <EmptyChatState
          characterName={currentThread.character?.name || 'AI'}
          onSend={wrappedHandleSend}
          isGenerating={isGenerating}
          onInterrupt={handleInterrupt}
        />
      ) : (
        <ChatContainer
          messages={messages}
          threadId={currentThread.id}
          threadDocumentIds={currentThread.metadata?.documentIds}
          onSend={wrappedHandleSend}
          isGenerating={isGenerating}
          onInterrupt={handleInterrupt}
          onMessagePress={handleMessagePress}
        />
      )}
    </ChatLayout>
  );
}; 


