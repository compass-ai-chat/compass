import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';
import { ChatInput, ChatInputRef, MentionedCharacter } from './ChatInput';
import { useChat } from '@/src/hooks/useChat';
import { Document } from '@/src/types/core';
import { useAtomValue } from 'jotai';
import { userDocumentsAtom } from '@/src/hooks/atoms';

interface EmptyChatStateProps {
  characterName: string;
  onSend: (message: string, mentionedCharacters: MentionedCharacter[], mentionedDocuments: Document[]) => void;
  isGenerating: boolean;
  onInterrupt: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  characterName,
  onSend,
  isGenerating,
  onInterrupt
}) => {
  const { t } = useLocalization();
  const chatInputRef = useRef<ChatInputRef>(null);
  const { currentThread} = useChat();
  const userDocuments = useAtomValue(userDocumentsAtom);

  // Get initial mentioned documents from thread metadata
  const initialMentionedDocuments = useMemo(() => {
    const documentIds = currentThread.metadata?.documentIds || [];
    return userDocuments.filter(doc => documentIds.includes(doc.id));
  }, [currentThread.metadata?.documentIds, userDocuments]);

  useEffect(()=>{
    chatInputRef.current?.focus();
  }, [currentThread])

  return (
    <View className="flex-1 items-center justify-center">
      <View className={`w-2/3 px-4 ${Platform.OS == 'web' ? 'w-[80%]' : 'w-full'}`}>
        <View className="mb-8">
          <Text className="text-2xl font-bold text-center text-text mb-2">
            ✨ {t('chats.start_a_conversation_with_character', { character: characterName })}
          </Text>
          <Text className="text-center text-text opacity-70">
            {t('chats.ask_a_question_or_start_a_conversation')}
          </Text>
        </View>
        <ChatInput 
          ref={chatInputRef}
          onSend={onSend} 
          isGenerating={isGenerating}
          onInterrupt={onInterrupt}
          className="shadow-lg rounded-xl"
          initialInputRows={3}
          initialMentionedDocuments={initialMentionedDocuments}
        />
      </View>
    </View>
  );
}; 