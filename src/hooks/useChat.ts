import { useRef, useCallback } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { ChatMessage, Thread, Document, Model, Character } from "@/src/types/core";
import { MentionedCharacter } from "@/src/components/chat/ChatInput";
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
  createDefaultThread,
} from "./atoms";
import { useSearch } from "./useSearch";
import { useCharacterModelSelection } from "./useCharacterModelSelection";
import { useVercelAIProvider } from "@/src/services/chat/providers/VercelAIProvider";
import { useStreamingMessage } from "./useStreamingMessage";
import { CharacterContextManager } from "@/src/services/chat/CharacterContextManager";
import { ChatProviderFactory } from "@/src/services/chat/ChatProviderFactory";
import LogService from "@/utils/LogService";
import { toastService } from "@/src/services/toastService";
import {
  MessageContext,
  MessageTransformPipeline,
  relevantPassagesTransform,
  urlContentTransform,
  webSearchTransform,
  threadUpdateTransform,
  firstMessageTransform,
  templateVariableTransform,
  mentionedDocumentsTransform,
} from "./pipelines";
import { ModelNotFoundException } from "@/src/services/chat/streamUtils";
import { SimpleSchema } from "../utils/zodHelpers";

// ========== Helper Functions ==========

const isAbortError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; code?: string; message?: string };
  const msg = typeof err.message === 'string' ? err.message.toLowerCase() : '';
  return err.name === 'AbortError' || err.code === 'ABORT_ERR' || msg.includes('abort');
};

const isMobileOrNarrowScreen = () => 
  Platform.OS !== "web" || typeof window === 'undefined' || window.innerWidth < 768;

function selectModelBasedOnRouting(
  character: Character | undefined,
  availableModels: Model[],
): Model | undefined {
  const routing = character?.modelRouting;
  
  if (!routing?.length) {
    return availableModels[0];
  }

  if (routing.length === 1) {
    return availableModels.find(
      m => m.id === routing[0].modelId && m.provider.id === routing[0].providerId
    );
  }

  // Random selection based on percentage weights
  const randomValue = Math.random() * 100;
  const selected = randomValue <= routing[0].percentage ? routing[0] : routing[1];
  
  return availableModels.find(
    m => m.id === selected.modelId && m.provider.id === selected.providerId
  );
}

// Singleton instances (created once)
const contextManager = new CharacterContextManager();
const pipeline = new MessageTransformPipeline()
  .addTransform(templateVariableTransform)
  .addTransform(urlContentTransform)
  .addTransform(relevantPassagesTransform)
  .addTransform(mentionedDocumentsTransform)
  .addTransform(webSearchTransform)
  .addTransform(threadUpdateTransform);

// ========== Main Hook ==========

export function useChat() {
  // State
  const currentThread = useAtomValue(currentThreadAtom);
  const threads = useAtomValue(threadsAtom);
  const documents = useAtomValue(documentsAtom);
  const searchEnabled = useAtomValue(searchEnabledAtom);
  const providers = useAtomValue(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [editingMessageIndex, setEditingMessageIndex] = useAtom(editingMessageIndexAtom);
  const sidebarVisible = useAtomValue(sidebarVisibleAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);

  // Hooks
  const { search } = useSearch();
  const { selectedModel, selectedCharacter } = useCharacterModelSelection();
  const { sendMessage, generateJSON } = useVercelAIProvider();
  const streaming = useStreamingMessage();

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========== Thread Management ==========

  const addNewThread = useCallback(() => {
    // Reuse empty thread if one exists
    const lastThread = threads[threads.length - 1];
    if (lastThread?.messages.length === 0) {
      dispatchThread({ type: "setCurrent", payload: lastThread });
      if (isMobileOrNarrowScreen()) {
        router.push(`/thread/${lastThread.id}`);
      }
      return;
    }

    const newThread: Thread = {
      ...createDefaultThread(),
      id: Date.now().toString(),
      character: selectedCharacter,
      selectedModel,
    };

    dispatchThread({ type: "add", payload: newThread });

    if (isMobileOrNarrowScreen()) {
      setTimeout(() => router.push(`/thread/${newThread.id}`), 100);
    }
  }, [threads, selectedCharacter, selectedModel, dispatchThread]);

  // ========== Message Sending ==========

  const sendChatMessage = useCallback(async (
    messages: ChatMessage[],
    message: string,
    thread: Thread,
    mentionedCharacters: MentionedCharacter[] = [],
    mentionedDocuments: Document[] = [],
    images: string[] = [],
  ) => {
    abortControllerRef.current = new AbortController();
    
    const context = contextManager.prepareContext(
      message, thread, mentionedCharacters, mentionedDocuments, images
    );
    
    // Determine model to use
    let model = thread.selectedModel;
    if (thread.character || !model) {
      model = selectModelBasedOnRouting(thread.character, models);
    }
    
    if (!model?.provider) {
      throw new Error("No provider found");
    }

    const chatProvider = ChatProviderFactory.getProvider(model.provider);

    // Gather relevant documents
    const relevantDocuments = [
      ...documents.filter(doc => thread.character?.documentIds?.includes(doc.id)),
      ...documents.filter(doc => thread.metadata?.documentIds?.includes(doc.id)),
    ];

    const initialContext: MessageContext = {
      message: context.newMessage,
      provider: chatProvider,
      thread: { ...thread, messages, selectedModel: model },
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

    let workingThread = initialContext.thread;

    try {
      const transformedContext = await pipeline.process(initialContext);
      workingThread = transformedContext.metadata.updatedThread;

      // Build messages to send
      transformedContext.context.messagesToSend.push({
        ...transformedContext.context.assistantPlaceholder,
        modelUsed: { id: model.id, providerId: model.provider.id },
        role: 'assistant',
      } as ChatMessage);

      const messagesToSend = [
        ...transformedContext.context.historyToSend,
        ...transformedContext.context.messagesToSend,
      ];

      if (transformedContext.systemPrompt.trim()) {
        messagesToSend.unshift({ content: transformedContext.systemPrompt, role: 'system' });
      }

      const { textStream, toolCallStream, reasoningStream } = await sendMessage(
        messagesToSend,
        model,
        context.characterToUse,
        abortControllerRef.current.signal,
      );

      // Process streams in parallel
      streaming.handleToolCalls(toolCallStream, workingThread);
      await streaming.handleStream(textStream, reasoningStream, workingThread);
      await streaming.flush(workingThread);

      firstMessageTransform.transform(initialContext);
    } catch (error) {
      await streaming.flush(workingThread);
      handleSendError(error, model, models, setModels);
    } finally {
      abortControllerRef.current = null;
    }
  }, [models, documents, searchEnabled, search, dispatchThread, sendMessage, streaming, setModels]);

  const handleSend = useCallback(async (
    message: string,
    mentionedCharacters: MentionedCharacter[],
    mentionedDocuments: Document[],
    images: string[] = [],
  ) => {
    if (!providers.length) return;

    // Reset document IDs and prepare messages
    const thread = { ...currentThread };
    if (thread.metadata?.documentIds) {
      thread.metadata.documentIds = [];
    }
    
    let messages = [...thread.messages];
    
    // Handle editing
    if (editingMessageIndex !== -1) {
      messages.splice(editingMessageIndex);
      setEditingMessageIndex(-1);
    }

    // Ensure thread exists in storage
    if (!threads.some(t => t.id === thread.id)) {
      await dispatchThread({ type: "add", payload: thread });
    }

    setIsGenerating(true);
    try {
      await sendChatMessage(messages, message, thread, mentionedCharacters, mentionedDocuments, images);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    providers.length, currentThread, threads, editingMessageIndex,
    dispatchThread, setEditingMessageIndex, setIsGenerating, sendChatMessage
  ]);

  const handleInterrupt = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    streaming.flush(currentThread);
    streaming.stopStreaming();
    setIsGenerating(false);
  }, [currentThread, streaming, setIsGenerating]);

  const handleMessagePress = useCallback((index: number, message: ChatMessage) => {
    if (message.role === 'user') {
      setEditingMessageIndex(index);
    }
  }, [setEditingMessageIndex]);

  // ========== Utilities ==========

  const streamMessage = useCallback(async (messages: ChatMessage[]) => {
    const model = models[0];
    if (!model) throw new Error("No model found");
    const { textStream } = await sendMessage(messages, model);
    return textStream;
  }, [models, sendMessage]);

  const generateJSONObject = useCallback(async (prompt: string, schema: SimpleSchema) => {
    const model = models[0];
    if (!model) throw new Error("No model found");
    return generateJSON(prompt, schema, model);
  }, [models, generateJSON]);

  const isModelAvailable = useCallback(() => models.length > 0, [models.length]);

  return {
    // Message handling
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
    // Utilities
    generateJSONObject,
    isModelAvailable,
    // Legacy alias
    wrappedHandleSend: handleSend,
  };
}

// ========== Error Handling ==========

function handleSendError(
  error: unknown,
  selectedModel: Model | undefined,
  models: Model[],
  setModels: (models: Model[]) => void,
) {
  if (isAbortError(error)) return;

  if (error instanceof ModelNotFoundException && selectedModel) {
    const updatedModels = models.filter(
      m => !(m.id === selectedModel.id && m.provider.id === selectedModel.provider.id)
    );
    setModels(updatedModels);
    toastService.danger({
      title: "Model Not Available",
      description: `The model "${selectedModel.id}" is no longer available. It has been removed from your models list.`,
    });
  } else {
    const err = error as Error;
    toastService.danger({
      title: "Error sending message",
      description: err.message,
    });
  }

  LogService.log(error as Error, { component: "useChat", function: "sendChatMessage" }, "error");
}
