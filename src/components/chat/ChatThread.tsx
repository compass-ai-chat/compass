import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { View, ScrollView, Platform, TouchableOpacity, Text, FlatList } from 'react-native';
import { Message } from './Message';
import { ChatInput, ChatInputRef } from './ChatInput';
import { useChat } from '@/src/hooks/useChat';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Model, Character, ChatMessage } from '@/src/types/core';

import { 
  currentThreadAtom, 
  threadActionsAtom, 
  threadsAtom,
  editingMessageIndexAtom,
  isGeneratingAtom,
  availableProvidersAtom,
  previewCodeAtom,
  sidebarVisibleAtom,
  availableModelsAtom,
  charactersAtom,
} from '@/src/hooks/atoms';
import { MentionedCharacter } from './ChatInput';
import { CodePreview } from './CodePreview';
import { parseCodeBlocks } from '@/src/utils/codeParser';
import { Modal } from '@/src/components/ui/Modal';
import { useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '@/src/hooks/useLocalization';
import { ThreadsSidebar } from '../web/ThreadsSidebar';
import { ChatTopbar } from './ChatTopbar';
import { DropdownElement } from '../ui/Dropdown';
import { fetchAvailableModelsV2 } from '@/src/hooks/useModels';

export const ChatThread: React.FC = () => {
  const flatListRef = useRef<FlatList<any>>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [currentThread, setCurrentThread] = useAtom(currentThreadAtom);
  const [threads] = useAtom(threadsAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const [providers] = useAtom(availableProvidersAtom);
  const [sidebarVisible, setSidebarVisible] = useAtom(sidebarVisibleAtom);
  const previousThreadId = useRef(currentThread.id);

  const [editingMessageIndex, setEditingMessageIndex] = useAtom(editingMessageIndexAtom);

  const [previewCode, setPreviewCode] = useAtom(previewCodeAtom);

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { t } = useLocalization();

  const [selectedModel, setSelectedModel] = useState<Model>();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>();

  const [models, setModels] = useAtom(availableModelsAtom);
  const characters = useAtomValue(charactersAtom);


  const loadCharacterAndModel = () => {
    const noCharacterOrModel = !currentThread.selectedModel && !currentThread.character;

    if(noCharacterOrModel){
      // pick first model and character
      setSelectedModel(models[0]);
      setSelectedCharacter(characters[0]);
    }
    else{
      setSelectedModel(currentThread.selectedModel);
      setSelectedCharacter(currentThread.character);
    }
  }

  const loadFreshModelList = async () => {
    const fetchedModels = await fetchAvailableModelsV2(providers.filter((p) => p.capabilities?.llm))
    setModels(fetchedModels);
  }
  
  useEffect(() => {
    chatInputRef.current?.focus();
    if (previousThreadId.current !== currentThread.id) {
      
      previousThreadId.current = currentThread.id;
      setIsGenerating(false);

      loadCharacterAndModel();
    }

  }, [currentThread.id]);

  useEffect(() => {
    loadCharacterAndModel();
    loadFreshModelList();
  }, [currentThread]);


  const { handleSend, handleInterrupt } = useChat();

  const wrappedHandleSend = async (message: string, mentionedCharacters: MentionedCharacter[]) => {
    if(!providers.length) {
      return;
    }

    if(Platform.OS == 'web'){
      setSidebarVisible(false);
    }
    
    let messages = [...currentThread.messages];

    const isEditing = editingMessageIndex !== -1;

    if (isEditing) {
      messages.splice(editingMessageIndex);
      setEditingMessageIndex(-1);
    }

    if (currentThread.messages.length === 0 && threads.filter(t => t.id === currentThread.id).length === 0) {
      await dispatchThread({ 
        type: 'add', 
        payload: currentThread 
      });
    }

    setIsGenerating(true);
    try {
      await handleSend(messages, message, mentionedCharacters);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsGenerating(false);
      if(flatListRef.current) {
        await new Promise(resolve => setTimeout(resolve, 200));
        debouncedScrollToEnd();
      }
    }
  };

  const handleMessagePress = (index: number, message: ChatMessage) =>{
    if (message.isUser) {
      console.log("User pressed message", message, index);
      setEditingMessageIndex(index);

      chatInputRef.current?.setEditMessage(message.content);

    }
  };

  const renderItem = ({ item: message, index }: { item: any; index: number }) => {
    const parsedCode = !message.isUser ? parseCodeBlocks(message.content) : null;

    return (
      <Message
        content={message.content}
        isUser={message.isUser}
        character={message.character}
        index={index}
        onEdit={() => handleMessagePress(index, message)}
        onPreviewCode={() => parsedCode && setPreviewCode(parsedCode)}
        hasPreviewableCode={!!parsedCode}
      />
    );
  };

  const scrollToEnd = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 99999999, animated: true });
      setUserHasScrolled(false);
      setShowScrollButton(false);
    }
  }, []);

  // Debounced version of scrollToEnd
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
    
    // If user has scrolled up more than 50 pixels from bottom, consider it as manual scroll
    const hasScrolledUp = maxOffset - currentOffset > 50;
    setUserHasScrolled(hasScrolledUp);
    setShowScrollButton(hasScrolledUp);
  }, []);

  // Reset userHasScrolled when generation stops
  useEffect(() => {
    if (!isGenerating) {
      setUserHasScrolled(false);
    }
  }, [isGenerating]);

  const messages = currentThread?.messages || [];
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
    }))
  ], [models, characters]);

  const selectedElement = selectedCharacter 
    ? dropdownElements.find(el => el.id === selectedCharacter.id)
    : dropdownElements.find(el => el.id === selectedModel?.id);

  const getCharacterModel = (character: Character) => {
    if(character.allowedModels?.length){ // fetch allowed model from character
      return models.find((m) => character?.allowedModels?.map(x=>x.id).includes(m.id))
    }
    // use first model if no models are available
    return models.find(x=>true);
  }

  const setCharacterAndModel = (character: Character | undefined, model: Model | undefined) => {
    setSelectedCharacter(character);
    setSelectedModel(model);
    dispatchThread({
      type: 'update',
      payload: { ...currentThread, character: character, selectedModel: model }
    });
  }

  const handleSelection = (element: DropdownElement) => {
    const { type, data } = element.metadata;
    
    if (type === 'model') {
      setCharacterAndModel(undefined, data);
    } else {
      const characterModel = getCharacterModel(data);
      console.log("Character model", characterModel)
      setCharacterAndModel(data, characterModel);
    }
  };

  return (
    <View className="flex-row flex-1">

    <View className="flex-1 bg-background">
      {Platform.OS != 'web' || true && (<ChatTopbar 
        dropdownElements={dropdownElements}
        selectedElement={selectedElement}
        onSelection={handleSelection}
      />)}
      <ThreadsSidebar />
      
      {isEmpty ? (
        <View className="flex-1 items-center justify-center">
          <View className="w-2/3 px-4">
            <View className="mb-8">
              <Text className="text-2xl font-bold text-center text-text mb-2">
              ✨ {t('chats.start_a_conversation_with_character', { character: currentThread.character?.name || 'AI' })}
              </Text>
              <Text className="text-center text-text opacity-70">
                {t('chats.ask_a_question_or_start_a_conversation')}
              </Text>
            </View>
            <ChatInput 
              ref={chatInputRef}
              onSend={wrappedHandleSend} 
              isGenerating={isGenerating}
              onInterrupt={handleInterrupt}
              className="shadow-lg rounded-xl"
              initialInputRows={3}
            />
          </View>
        </View>
      ) : (
        <View className={`mx-auto flex-1 ${Platform.OS == 'web' ? 'w-[80%]' : ''}`}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                debouncedScrollToEnd();
              }
            }}
            keyExtractor={(_, index) => index.toString()}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
            className={`flex-1 -mt-4`}
            contentContainerStyle={{ padding: 16, paddingBottom: 50, paddingTop: 50 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center p-4">
                {/* Optional: Add an empty state message */}
              </View>
            }
            onScroll={handleScroll}
            onScrollBeginDrag={() => setUserHasScrolled(true)}
          />
          
          {showScrollButton && (
            <View className="absolute bottom-24 left-0 right-0 items-center mb-2">
              <TouchableOpacity 
                onPress={scrollToEnd}
                className="bg-primary w-10 h-10 rounded-full items-center justify-center shadow-md"
              >
                <Ionicons name="chevron-down" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
          
          <ChatInput 
            ref={chatInputRef}
            onSend={wrappedHandleSend} 
            isGenerating={isGenerating}
            onInterrupt={handleInterrupt}
            className={`${Platform.OS == 'web' ? 'mb-8 rounded-xl' : ''}`}
            initialInputRows={3}
          />
        </View>
      )}
      
    </View>
    {/* Show side panel on desktop, modal on mobile */}
    {previewCode && (
      isDesktop ? (
        <View className="flex-1 p-4 overflow-hidden w-1/3 h-screen">
          <CodePreview
            {...previewCode}
            onClose={() => setPreviewCode(null)}
          />
        </View>
      ) : (
        <Modal
          isVisible={!!previewCode}
          onClose={() => setPreviewCode(null)}
        >
          <View className="flex-1">
            <CodePreview
              {...previewCode}
              onClose={() => setPreviewCode(null)}
            />
          </View>
        </Modal>
      )
    )}
      </View>
  );
}; 


