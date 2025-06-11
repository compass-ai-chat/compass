import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

// Types
import { Character, ChatMessage, Thread, Document, Model, Provider } from '@/src/types/core';
import { MentionedCharacter } from '@/src/components/chat/ChatInput';

// Atoms  
import { 
  currentThreadAtom, 
  threadActionsAtom, 
  searchEnabledAtom, 
  documentsAtom, 
  availableModelsAtom, 
  defaultThreadAtom, 
  availableProvidersAtom, 
  sidebarVisibleAtom, 
  isGeneratingAtom, 
  editingMessageIndexAtom, 
  threadsAtom 
} from './atoms';

// Hooks
import { useTTS } from './useTTS';
import { useSearch } from './useSearch';
import { useCharacterModelSelection } from './useCharacterModelSelection';
import { useVercelAIProvider } from '@/src/services/chat/providers/VercelAIProvider';

// Services
import { CharacterContextManager } from '@/src/services/chat/CharacterContextManager';
import { ChatProviderFactory } from '@/src/services/chat/ChatProviderFactory';
import LogService from '@/utils/LogService';
import { toastService } from '@/src/services/toastService';

// Pipelines
import { 
  MessageContext, 
  MessageTransformPipeline, 
  relevantPassagesTransform, 
  urlContentTransform, 
  webSearchTransform, 
  threadUpdateTransform, 
  firstMessageTransform, 
  documentContextTransform, 
  templateVariableTransform 
} from './pipelines';

// Exceptions
import { ModelNotFoundException } from '@/src/services/chat/streamUtils';

export function useChat() {
  // ========== State Management ==========
  const currentThread = useAtomValue(currentThreadAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const documents = useAtomValue(documentsAtom);
  const [threads] = useAtom(threadsAtom);
  const [searchEnabled] = useAtom(searchEnabledAtom);
  const [models, setModels] = useAtom(availableModelsAtom);
  const [providers] = useAtom(availableProvidersAtom);
  const [sidebarVisible, setSidebarVisible] = useAtom(sidebarVisibleAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [editingMessageIndex, setEditingMessageIndex] = useAtom(editingMessageIndexAtom);
  const defaultThread = useAtomValue(defaultThreadAtom);

  // ========== Refs and External Hooks ==========
  const abortController = useRef<AbortController | null>(null);
  const previousThreadId = useRef(currentThread.id);
  const { search } = useSearch();
  const tts = useTTS();
  const { selectedModel, selectedCharacter } = useCharacterModelSelection();
  const { sendMessage } = useVercelAIProvider();

  // ========== Services ==========
  const contextManager = new CharacterContextManager();
  
  const pipeline = new MessageTransformPipeline()
    .addTransform(templateVariableTransform)
    .addTransform(documentContextTransform)  
    .addTransform(urlContentTransform)
    .addTransform(relevantPassagesTransform)
    .addTransform(webSearchTransform)
    .addTransform(threadUpdateTransform)
    .addTransform(firstMessageTransform);

  // ========== Stream Handling ==========
  const handleStream = async (
    response: AsyncIterable<string>,
    thread: Thread,
  ) => {
    try {
      console.log("handling stream", typeof response, response);
    
      let assistantMessage = thread.messages[thread.messages.length - 1].content;
      let chunkCount = 0;
    
      for await (const content of response) {
        chunkCount++;
        assistantMessage += content;
        await updateMessageContent(content, chunkCount, assistantMessage, thread);
      }

      if (tts.isSupported) {
        await tts.streamText("");
      }
    } 
    catch(error: any) {
      if(error instanceof ModelNotFoundException){
        throw error;
      }
      
      console.log('Stream handling error:', error);
      const vercelErrorResponse = error?.error?.lastError?.responseBody;
      if(vercelErrorResponse){
        try{
          const json = JSON.parse(vercelErrorResponse);
          toastService.warning({
            title: "Error", 
            description: json.error.charAt(0).toUpperCase() + json.error.slice(1)
          });
        }
        catch(e){
          toastService.danger({title: "Error", description: vercelErrorResponse});
        }
      }
      LogService.log(error, {component: 'useChat', function: 'handleStream'}, 'error');
    }
  };

  const updateMessageContent = async (
    content: string,
    chunkCount: number,
    assistantMessage: string,
    thread: Thread,
  ): Promise<void> => {
    // Handle TTS if supported
    if (tts.isSupported) {
      if (chunkCount === 1) await tts.streamText(" ");
      tts.streamText(content);
    }

    // Update the thread with new content
    const updatedMessages = [...thread.messages];
    const lastMessage = updatedMessages[updatedMessages.length - 1];
    if (lastMessage && !lastMessage.isUser) {
      lastMessage.content = assistantMessage;
      dispatchThread({
        type: 'updateMessages',
        payload: {
          threadId: thread.id,
          messages: updatedMessages
        }
      });
      // RN has a debounce for rendering, so it's better to wait a bit before updating the message
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // ========== Thread Management ==========
  const addNewThread = async () => {
    console.log("selected model", selectedModel);

    // if latest thread has zero messages, do not add new thread
    if(threads.length > 0 && threads[threads.length - 1].messages.length === 0){
      return;
    }

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

  // ========== Message Handling ==========
  const sendChatMessage = async (
    messages: ChatMessage[], 
    message: string, 
    mentionedCharacters: MentionedCharacter[] = []
  ) => {
    abortController.current = new AbortController();
    currentThread.messages = messages;
    let context = contextManager.prepareContext(message, currentThread, mentionedCharacters);
    
    if(!currentThread.selectedModel?.provider){
      throw new Error('No provider found');
    }

    const chatProvider = ChatProviderFactory.getProvider(currentThread.selectedModel?.provider);

    let relevantDocuments = documents.filter((doc: Document) => 
      currentThread.character?.documentIds?.includes(doc.id) ?? false
    );
    relevantDocuments.push(...documents.filter((doc: Document) => 
      currentThread.metadata?.documentIds?.includes(doc.id) ?? []
    ));

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

      let messagesToSend = [
        ...transformedContext.context.historyToSend, 
        ...transformedContext.context.messagesToSend
      ];
      
      if(transformedContext.systemPrompt.trim().length > 0){
        messagesToSend.unshift({
          content: transformedContext.systemPrompt, 
          isUser: false, 
          isSystem: true
        });
      }

      const response = await sendMessage(
        messagesToSend, 
        currentThread.selectedModel, 
        context.characterToUse, 
        abortController.current.signal
      );

      await handleStream(response, transformedContext.metadata.updatedThread);

    } catch (error: any) {
      console.log('Error sending message:', error);
      
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
      
      LogService.log(error, {component: 'useChat', function: 'sendChatMessage'}, 'error');
    } finally {
      abortController.current = null;
    }
  };

  const handleSend = async (message: string, mentionedCharacters: MentionedCharacter[]) => {
    if (!providers.length) return;

    if (Platform.OS == 'web') {
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
      await sendChatMessage(messages, message, mentionedCharacters);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMessagePress = (index: number, message: ChatMessage) => {
    if (message.isUser) {
      setEditingMessageIndex(index);
    }
  };

  // ========== Effects ==========
  useEffect(() => {
    if (previousThreadId.current !== currentThread.id) {
      previousThreadId.current = currentThread.id;
    }
  }, [currentThread.id]);

  // ========== Return Interface ==========
  return { 
    // Core message handling
    handleSend,
    handleInterrupt,
    handleMessagePress,
    
    // Thread management  
    addNewThread,
    
    // State
    isGenerating,
    setIsGenerating,
    editingMessageIndex,
    sidebarVisible,
    currentThread,
    
    // Legacy support (deprecated)
    wrappedHandleSend: handleSend
  };
}

