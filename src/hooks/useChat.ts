import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Types
import {
  Character,
  ChatMessage,
  Thread,
  Document,
  Model,
  Provider,
} from "@/src/types/core";
import { MentionedCharacter } from "@/src/components/chat/ChatInput";

// Atoms
import {
  currentThreadAtom,
  threadActionsAtom,
  searchEnabledAtom,
  documentsAtom,
  availableModelsAtom,
  availableProvidersAtom,
  sidebarVisibleAtom,
  isGeneratingAtom,
  editingMessageIndexAtom,
  threadsAtom,
  streamingMessageAtom,
  createDefaultThread,
} from "./atoms";

// Hooks
import { useTTS } from "./useTTS";
import { useSearch } from "./useSearch";
import { useCharacterModelSelection } from "./useCharacterModelSelection";
import {
  useVercelAIProvider,
  ToolCall,
} from "@/src/services/chat/providers/VercelAIProvider";

// Services
import { CharacterContextManager } from "@/src/services/chat/CharacterContextManager";
import { ChatProviderFactory } from "@/src/services/chat/ChatProviderFactory";
import LogService from "@/utils/LogService";
import { toastService } from "@/src/services/toastService";

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
  templateVariableTransform,
  mentionedDocumentsTransform,
} from "./pipelines";

// Exceptions
import { ModelNotFoundException } from "@/src/services/chat/streamUtils";
import { SimpleSchema } from "../utils/zodHelpers";

const isAbortError = (error: any): boolean => {
  if (!error) return false;
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return error.name === 'AbortError' || error.code === 'ABORT_ERR' || msg.includes('abort');
};

function selectModelBasedOnRouting(
  character: Character | undefined,
  availableModels: Model[],
): Model | undefined {
  if (!character?.modelRouting || character.modelRouting.length < 1) {
    return availableModels.find((x) => true);
  }

  if (character.modelRouting.length === 1) {
    return availableModels.find(
      (x) =>
        x.id === character.modelRouting![0].modelId &&
        x.provider.id === character.modelRouting![0].providerId,
    );
  }

  // Generate a random number between 0 and 100
  const randomValue = Math.random() * 100;

  // If random value is less than first model's percentage, use first model
  const selectedRouting =
    randomValue <= character.modelRouting[0].percentage
      ? character.modelRouting[0]
      : character.modelRouting[1];

  console.log(
    `selected model ${selectedRouting.modelId} based on value ${randomValue}`,
  );

  return availableModels.find(
    (m) =>
      m.id === selectedRouting.modelId &&
      m.provider.id === selectedRouting.providerId,
  );
}

export function useChat() {
  // ========== State Management ==========
  // Use the simplified current thread atom (no longer needs loadable)
  const currentThread = useAtomValue(currentThreadAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const documents = useAtomValue(documentsAtom);
  const [threads] = useAtom(threadsAtom);
  const [searchEnabled] = useAtom(searchEnabledAtom);
  const [models, setModels] = useAtom(availableModelsAtom);
  const [providers] = useAtom(availableProvidersAtom);
  const [sidebarVisible, setSidebarVisible] = useAtom(sidebarVisibleAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [editingMessageIndex, setEditingMessageIndex] = useAtom(
    editingMessageIndexAtom,
  );
  // Use useSetAtom to avoid re-renders on streaming updates
  const setStreamingMessage = useSetAtom(streamingMessageAtom);

  // ========== Refs and External Hooks ==========
  const abortController = useRef<AbortController | null>(null);
  const previousThreadId = useRef(currentThread.id);
  // Ref to hold latest thread value for use in callbacks without re-creating them
  const currentThreadRef = useRef(currentThread);
  // Ref to hold latest streaming end message for flush function
  const streamingMessageRef = useRef<{
    threadId: string;
    index: number;
    content: string;
    reasoning?: string;
    toolCalls?: any[];
  } | null>(null);
  // Ref to hold latest threads array for use in callbacks
  const threadsRef = useRef(threads);
  // Debounce timer for persisting to storage
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Wrapper for setStreamingMessage that also updates the ref
  const updateStreamingMessage = useCallback((value: typeof streamingMessageRef.current | ((prev: typeof streamingMessageRef.current) => typeof streamingMessageRef.current)) => {
    if (typeof value === 'function') {
      const newValue = value(streamingMessageRef.current);
      streamingMessageRef.current = newValue;
      setStreamingMessage(newValue);
    } else {
      streamingMessageRef.current = value;
      setStreamingMessage(value);
    }
  }, [setStreamingMessage]);
  
  // Keep refs in sync with state
  useEffect(() => {
    currentThreadRef.current = currentThread;
  }, [currentThread]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const { search } = useSearch();
  const tts = useTTS();
  const { selectedModel, selectedCharacter } = useCharacterModelSelection();
  const { sendMessage, generateJSON } = useVercelAIProvider();

  // ========== Services ==========
  const contextManager = new CharacterContextManager();

  const pipeline = new MessageTransformPipeline()
    .addTransform(templateVariableTransform)
    //.addTransform(documentContextTransform)
    .addTransform(urlContentTransform)
    .addTransform(relevantPassagesTransform)
    .addTransform(mentionedDocumentsTransform)
    .addTransform(webSearchTransform)
    .addTransform(threadUpdateTransform)
    //.addTransform(firstMessageTransform);

  // ========== Stream Handling ==========
  const handleToolCalls = async (
    toolCallStream: AsyncIterable<ToolCall>,
    thread: Thread,
  ) => {
    try {
      let toolCalls: ToolCall[] = [];
      for await (const toolCall of toolCallStream) {
        //console.log("toolCall", toolCall);

        // if toolCall not in toolCalls, add it - otherwise replace it - based on toolCallId
        const idx = toolCalls.findIndex(tc => tc.toolCallId === toolCall.toolCallId);
        if (idx === -1) {
          toolCalls.push(toolCall);
        } else {
          toolCalls[idx] = toolCall;
        }

        await updateLastAssistantMessage(
          { role: 'assistant', toolCalls: toolCalls },
          thread,
        );
      }
    } catch (error: any) {
      if (isAbortError(error)) return;
      console.log("Tool call handling error:", error);
      LogService.log(
        error,
        { component: "useChat", function: "handleToolCalls" },
        "error",
      );
    }
  };

  const handleStream = async (
    textStream: AsyncIterable<string>,
    reasoningStream: AsyncIterable<string>,
    thread: Thread,
  ) => {
    try {
      let assistantMessage =
        thread.messages[thread.messages.length - 1].content;
      let chunkCount = 0;

      let reasoning = "";

      const handleReasoning = async () => {
        for await (const content of reasoningStream) {
          if (!content) continue;
          reasoning += content;
          await updateLastAssistantMessage(
            { role: 'assistant', reasoning },
            thread,
          );
        }
      };

      const handleText = async () => {
        for await (const content of textStream) {
          chunkCount++;
          assistantMessage += content;
          await updateMessageContent(
            content,
            chunkCount,
            assistantMessage,
            thread,
          );
        }
      };

      await Promise.allSettled([handleReasoning(), handleText()]);

      if (tts.isSupported) {
        await tts.streamText("");
      }
    } catch (error: any) {
      if (isAbortError(error)) {
        return;
      }
      if (error instanceof ModelNotFoundException) {
        throw error;
      }

      console.log("Stream handling error:", error);
      const vercelErrorResponse = error?.error?.lastError?.responseBody;
      if (vercelErrorResponse) {
        try {
          const json = JSON.parse(vercelErrorResponse);
          toastService.warning({
            title: "Error",
            description:
              json.error.charAt(0).toUpperCase() + json.error.slice(1),
          });
        } catch (e) {
          toastService.danger({
            title: "Error",
            description: vercelErrorResponse,
          });
        }
      }
      LogService.log(
        error,
        { component: "useChat", function: "handleStream" },
        "error",
      );
    }
  };

  const updateLastAssistantMessage = async (
    message: Partial<ChatMessage>,
    thread: Thread,
  ) => {
    const messageIndex = thread.messages.length - 1;
    const lastMessage = thread.messages[messageIndex];
    
    if (lastMessage && lastMessage.role != 'user') {
      // Update the in-memory streaming atom for instant UI updates ONLY
      // No persistence during streaming - only persist when streaming ends via flushStreamingMessage
      updateStreamingMessage(prev => ({
        threadId: thread.id,
        index: messageIndex,
        content: message.content ?? prev?.content ?? '',
        reasoning: message.reasoning ?? prev?.reasoning,
        toolCalls: message.toolCalls ?? prev?.toolCalls,
      }));
    }
  };

  // Function to flush any pending updates to storage (call when streaming ends)
  const flushStreamingMessage = useCallback(async (thread: Thread) => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    
    // Use ref to get the latest streaming message value
    const streaming = streamingMessageRef.current;
    if (!streaming || streaming.threadId !== thread.id) {
      return;
    }
    
    const messageIndex = streaming.index;
    
    // Ensure the message exists at the expected index
    if (messageIndex < 0 || messageIndex >= thread.messages.length) {
      console.warn('flushStreamingMessage: Invalid message index', messageIndex, 'thread has', thread.messages.length, 'messages');
      updateStreamingMessage(null);
      return;
    }

    const lastMessage = thread.messages[messageIndex];
    if (!lastMessage) {
      updateStreamingMessage(null);
      return;
    }
    
    const merged = { 
      ...lastMessage, 
      content: streaming.content,
      reasoning: streaming.reasoning,
      toolCalls: streaming.toolCalls,
    } as ChatMessage;

    // Wait for persistence to complete before clearing streaming state
    await dispatchThread({
      type: "updateMessage",
      payload: {
        threadId: thread.id,
        message: merged,
        index: messageIndex,
      },
    });
    
    // Only clear streaming message after persistence is confirmed
    updateStreamingMessage(null);
  }, [dispatchThread, updateStreamingMessage]);

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

    await updateLastAssistantMessage(
      { content: assistantMessage, role: 'assistant' },
      thread,
    );
  };

  // ========== Thread Management ==========
  const addNewThread = async () => {
    console.log("selected model", selectedModel);
    const currentThreads = threadsRef.current;

    // if latest thread has zero messages, do not add new thread but instead set the current thread to the latest thread
    if (
      currentThreads.length > 0 &&
      currentThreads[currentThreads.length - 1].messages.length === 0
    ) {
      dispatchThread({
        type: "setCurrent",
        payload: currentThreads[currentThreads.length - 1],
      });
      if (Platform.OS != "web" || typeof window === 'undefined' || window.innerWidth < 768) {
        router.push(`/thread/${currentThreads[currentThreads.length - 1].id}`);
      }
      return;
    }

    const newThread = {
      ...createDefaultThread(),
      id: Date.now().toString(),
      character: selectedCharacter,
      selectedModel: selectedModel,
    };

    dispatchThread({ type: "add", payload: newThread });

    if (Platform.OS != "web" || typeof window === 'undefined' || window.innerWidth < 768) {
      // wait 100 ms before pushing to allow for thread to be added to state
      setTimeout(() => {
        router.push(`/thread/${newThread.id}`);
      }, 100);
    }
  };

  const handleInterrupt = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    // Clear any pending persist timer
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    // Flush the current streaming message to storage before stopping
    const thread = currentThreadRef.current;
    flushStreamingMessage(thread);
    tts.stopStreaming();
    setIsGenerating(false);
  }, [tts, setIsGenerating, flushStreamingMessage]);

  // ========== Message Handling ==========
  const sendChatMessage = useCallback(async (
    messages: ChatMessage[],
    message: string,
    mentionedCharacters: MentionedCharacter[] = [],
    mentionedDocuments: Document[] = [],
    images: string[] = [],
  ) => {
    const thread = currentThreadRef.current;
    abortController.current = new AbortController();
    thread.messages = messages;
    let context = contextManager.prepareContext(
      message,
      thread,
      mentionedCharacters,
      mentionedDocuments,
      images
    );
    let selectedModel = thread.selectedModel;

    if(thread.character || !selectedModel){
      // Select model based on routing configuration
      selectedModel = selectModelBasedOnRouting(
        thread.character,
        models,
      );
    }
    
    if (!selectedModel?.provider) {
      throw new Error("No provider found");
    }

    const chatProvider = ChatProviderFactory.getProvider(
      selectedModel.provider,
    );

    let relevantDocuments = documents.filter(
      (doc: Document) =>
        thread.character?.documentIds?.includes(doc.id) ?? false,
    );
    relevantDocuments.push(
      ...documents.filter(
        (doc: Document) =>
          thread.metadata?.documentIds?.includes(doc.id) ?? [],
      ),
    );


    const initialContext: MessageContext = {
      message: context.newMessage,
      provider: chatProvider,
      thread: {
        ...thread,
        selectedModel, // Update the thread's selected model
      },
      allDocuments: documents,
      mentionedCharacters,
      mentionedDocuments,
      systemPrompt: thread.character?.content ?? "",
      context,
      metadata: {
        messages,
        searchEnabled,
        searchFunction: search,
        dispatchThread,
        documents: relevantDocuments,
      },
    };

    // Track the thread we're working with for error handling
    let workingThread = initialContext.thread;

    try {

      const transformedContext = await pipeline.process(initialContext);
      workingThread = transformedContext.metadata.updatedThread;

      transformedContext.context.messagesToSend.push({
        ...transformedContext.context.assistantPlaceholder,
        modelUsed: {
          id: selectedModel.id,
          providerId: selectedModel.provider.id,
        },
        role: 'assistant',
      });

      let messagesToSend = [
        ...transformedContext.context.historyToSend,
        ...transformedContext.context.messagesToSend,
      ];

      if (transformedContext.systemPrompt.trim().length > 0) {
        messagesToSend.unshift({
          content: transformedContext.systemPrompt,
          role: 'system',
        });
      }

      const { textStream, toolCallStream, reasoningStream } = await sendMessage(
        messagesToSend,
        selectedModel,
        context.characterToUse,
        abortController.current.signal,
      );

      // Handle tool calls in parallel
      handleToolCalls(
        toolCallStream,
        transformedContext.metadata.updatedThread,
      );

      await handleStream(
        textStream,
        reasoningStream,
        transformedContext.metadata.updatedThread,
      );

      // Flush any pending streaming updates to storage
      await flushStreamingMessage(transformedContext.metadata.updatedThread);

      firstMessageTransform.transform(initialContext);
    } catch (error: any) {
      console.log("Error sending message:", error);
      
      // Flush any partial streaming content on error
      await flushStreamingMessage(workingThread);

      if (isAbortError(error)) {
        // user-initiated cancel; no toast
      } else if (error instanceof ModelNotFoundException && selectedModel) {
        const updatedModels = models.filter(
          (m: Model) =>
            !(
              m.id === selectedModel?.id &&
              m.provider.id === selectedModel?.provider.id
            ),
        );

        setModels(updatedModels || []);

        toastService.danger({
          title: "Model Not Available",
          description: `The model "${selectedModel.id}" is no longer available. It has been removed from your models list.`,
        });
      } else {
        toastService.danger({
          title: "Error sending message",
          description: error.message,
        });
      }

      LogService.log(
        error,
        { component: "useChat", function: "sendChatMessage" },
        "error",
      );
    } finally {
      abortController.current = null;
    }
  }, [models, documents, searchEnabled, search, dispatchThread, contextManager, pipeline, sendMessage, handleToolCalls, handleStream, setModels, flushStreamingMessage]);

  const streamMessage = async (messages: ChatMessage[]) => {
    const model = models.find((x) => true);
    if (!model) {
      throw new Error("No model found");
    }
    const { textStream, toolCallStream } = await sendMessage(messages, model);

    // Handle tool calls in background
    //handleToolCalls(toolCallStream, currentThread);

    return textStream;
  };

  const generateJSONObject = async (prompt: string, schema: SimpleSchema) => {
    const model = models.find((x) => true);
    if (!model) {
      throw new Error("No model found");
    }
    return await generateJSON(prompt, schema, model);
  };

  const handleSend = useCallback(async (
    message: string,
    mentionedCharacters: MentionedCharacter[],
    mentionedDocuments: Document[],
    images: string[] = [],
  ) => {
    if (!providers.length) return;

    const thread = currentThreadRef.current;
    const currentThreads = threadsRef.current;

    if(thread.metadata?.documentIds) thread.metadata.documentIds = [];
    let messages = [...thread.messages];
    const isEditing = editingMessageIndex !== -1;

    if (isEditing) {
      messages.splice(editingMessageIndex);
      setEditingMessageIndex(-1);
    }

    if (
      currentThreads.filter((t) => t.id === thread.id).length === 0
    ) {
      await dispatchThread({
        type: "add",
        payload: thread,
      });
    }

    setIsGenerating(true);
    try {
      await sendChatMessage(messages, message, mentionedCharacters, mentionedDocuments, images);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [providers.length, editingMessageIndex, dispatchThread, setEditingMessageIndex, setIsGenerating, sendChatMessage]);

  const handleMessagePress = useCallback((index: number, message: ChatMessage) => {
    if (message.role == 'user') {
      setEditingMessageIndex(index);
    }
  }, [setEditingMessageIndex]);

  const isModelAvailable = () => {
    return models.length > 0;
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
    streamMessage,

    // Thread management
    addNewThread,

    // State
    isGenerating,
    setIsGenerating,
    editingMessageIndex,
    sidebarVisible,
    currentThread,

    // Legacy support (deprecated)
    wrappedHandleSend: handleSend,

    // JSON generation
    generateJSONObject,
    isModelAvailable,
  };
}
