import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { currentThreadAtom, threadActionsAtom, ThreadAction, searchEnabledAtom, documentsAtom, availableModelsAtom, defaultThreadAtom } from './atoms';
import { useRef } from 'react';
import { MentionedCharacter } from '@/src/components/chat/ChatInput';
import { useTTS } from './useTTS';
import { CharacterContextManager } from '@/src/services/chat/CharacterContextManager';
import { StreamHandlerService } from '@/src/services/chat/StreamHandlerService';
import { ChatProviderFactory } from '@/src/services/chat/ChatProviderFactory';
import { useSearch } from './useSearch';
import { Character, ChatMessage, Thread, Document, Model, Provider } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { toastService } from '@/src/services/toastService';
import { MessageContext, MessageTransformPipeline, relevantPassagesTransform, urlContentTransform, webSearchTransform, threadUpdateTransform, firstMessageTransform, documentContextTransform, templateVariableTransform } from './pipelines';
import { ModelNotFoundException } from '@/src/services/chat/streamUtils';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { useCharacterModelSelection } from './useCharacterModelSelection';
export function useChat() {
  const currentThread = useAtomValue(currentThreadAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const documents = useAtomValue(documentsAtom);
  const [searchEnabled] = useAtom(searchEnabledAtom);
  const abortController = useRef<AbortController | null>(null);
  const { search } = useSearch();
  const tts = useTTS();
  const [models, setModels] = useAtom(availableModelsAtom);
  const { selectedModel, selectedCharacter } = useCharacterModelSelection();
  const defaultThread = useAtomValue(defaultThreadAtom);


  const contextManager = new CharacterContextManager();
  const streamHandler = new StreamHandlerService(tts);

  const addNewThread = async () => {
    console.log("selected model", selectedModel);
    const newThread = {
      ...defaultThread, 
      id: Date.now().toString(),
      character: selectedCharacter,
      selectedModel: selectedModel
    };
    
    dispatchThread({ type: 'add', payload: newThread });
    
    if(Platform.OS != 'web' || window.innerWidth < 768){
    // wait 100 ms before pushing to allow for thread to be added to state
      setTimeout(() => {
        router.push(`/thread/${newThread.id}`);
      }, 100);
    }
  };

  const handleInterrupt = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    tts.stopStreaming();
  };


  const pipeline = new MessageTransformPipeline()
    .addTransform(templateVariableTransform)
    .addTransform(documentContextTransform)  
    .addTransform(urlContentTransform)
    .addTransform(relevantPassagesTransform)
    .addTransform(webSearchTransform)
    .addTransform(threadUpdateTransform)
    .addTransform(firstMessageTransform)
    

  const handleSend = async (messages: ChatMessage[], message: string, mentionedCharacters: MentionedCharacter[] = []) => {
    abortController.current = new AbortController();
    currentThread.messages = messages;
    let context = contextManager.prepareContext(message, currentThread, mentionedCharacters);
    
    if(!currentThread.selectedModel?.provider){
      throw new Error('No provider found');
    }
    

    const chatProvider = ChatProviderFactory.getProvider(currentThread.selectedModel?.provider);

    let relevantDocuments = documents.filter((doc: Document) => currentThread.character?.documentIds?.includes(doc.id) ?? false);
    relevantDocuments.push(...documents.filter((doc: Document) => currentThread.metadata?.documentIds?.includes(doc.id) ?? []));

    const initialContext: MessageContext = {
      message,
      provider: chatProvider,
      thread: currentThread,
      mentionedCharacters,
      systemPrompt: currentThread.character?.content ?? '',
      context,
      metadata: {
        messages,
        searchEnabled,
        searchFunction: search,
        dispatchThread,
        documents: relevantDocuments
      }
    };
    console.log("initialContext", initialContext);

    try {
      const transformedContext = await pipeline.process(initialContext);

      transformedContext.context.messagesToSend.push(transformedContext.context.assistantPlaceholder);

      let messages = [...transformedContext.context.historyToSend, ...transformedContext.context.messagesToSend];
      if(transformedContext.systemPrompt.trim().length > 0){
        messages.unshift({content: transformedContext.systemPrompt, isUser: false, isSystem: true});
      }
      
      const response = await chatProvider.sendMessage(
        messages,
        currentThread.selectedModel,
        context.characterToUse,
        abortController.current.signal
      );

      await streamHandler.handleStream(response, transformedContext.metadata.updatedThread, dispatchThread);

    } catch (error: any) {
      console.log('error', error);
      
      if (error instanceof ModelNotFoundException && currentThread.selectedModel) {
        
        const updatedModels = models.filter(
          (m: Model) => !(m.id === currentThread.selectedModel?.id && 
                         m.provider.id === currentThread.selectedModel?.provider.id)
        );
        
        setModels(updatedModels);
        
        toastService.danger({
          title: 'Model Not Available',
          description: `The model "${currentThread.selectedModel.id}" is no longer available. It has been removed from your models list.`
        });
      } else {
        toastService.danger({
          title: 'Error sending message',
          description: error.message
        });
      }
      
      LogService.log(error, {component: 'useChat', function: 'handleSend'}, 'error');
    } finally {
      abortController.current = null;
    }
  };

  return { handleSend, handleInterrupt, addNewThread };
}

