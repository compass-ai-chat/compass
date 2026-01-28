import { useCallback, useRef } from "react";
import { useSetAtom } from "jotai";
import { streamingMessageAtom, threadActionsAtom } from "./atoms";
import { ChatMessage, Thread } from "@/src/types/core";
import { useTTS } from "./useTTS";
import { ToolCall } from "@/src/services/chat/providers/VercelAIProvider";
import LogService from "@/utils/LogService";
import { toastService } from "@/src/services/toastService";
import { ModelNotFoundException } from "@/src/services/chat/streamUtils";

interface StreamingState {
  threadId: string;
  index: number;
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
}

const isAbortError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; code?: string; message?: string };
  const msg = typeof err.message === 'string' ? err.message.toLowerCase() : '';
  return err.name === 'AbortError' || err.code === 'ABORT_ERR' || msg.includes('abort');
};

export function useStreamingMessage() {
  const setStreamingMessage = useSetAtom(streamingMessageAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const tts = useTTS();
  
  // Keep streaming state in a ref for synchronous access during streaming
  const streamingRef = useRef<StreamingState | null>(null);

  const updateStreaming = useCallback((
    updater: StreamingState | null | ((prev: StreamingState | null) => StreamingState | null)
  ) => {
    const newValue = typeof updater === 'function' 
      ? updater(streamingRef.current) 
      : updater;
    streamingRef.current = newValue;
    setStreamingMessage(newValue);
  }, [setStreamingMessage]);

  const updateAssistantMessage = useCallback((
    updates: { content?: string; reasoning?: string; toolCalls?: ToolCall[]; role?: string },
    thread: Thread,
  ) => {
    const messageIndex = thread.messages.length - 1;
    const lastMessage = thread.messages[messageIndex];
    
    if (lastMessage?.role !== 'user') {
      updateStreaming(prev => ({
        threadId: thread.id,
        index: messageIndex,
        content: updates.content ?? prev?.content ?? '',
        reasoning: updates.reasoning ?? prev?.reasoning,
        toolCalls: updates.toolCalls ?? prev?.toolCalls,
      }));
    }
  }, [updateStreaming]);

  const flush = useCallback(async (thread: Thread) => {
    const streaming = streamingRef.current;
    if (!streaming || streaming.threadId !== thread.id) return;
    
    const { index: messageIndex, content, reasoning, toolCalls } = streaming;
    
    if (messageIndex < 0 || messageIndex >= thread.messages.length) {
      console.warn('flush: Invalid message index', messageIndex);
      updateStreaming(null);
      return;
    }

    const lastMessage = thread.messages[messageIndex];
    if (!lastMessage) {
      updateStreaming(null);
      return;
    }
    
    const merged = { 
      ...lastMessage, 
      content,
      reasoning,
      toolCalls,
    } as ChatMessage;

    await dispatchThread({
      type: "updateMessage",
      payload: { threadId: thread.id, message: merged, index: messageIndex },
    });
    
    updateStreaming(null);
  }, [dispatchThread, updateStreaming]);

  const handleToolCalls = useCallback(async (
    toolCallStream: AsyncIterable<ToolCall>,
    thread: Thread,
  ) => {
    try {
      const toolCalls: ToolCall[] = [];
      
      for await (const toolCall of toolCallStream) {
        const idx = toolCalls.findIndex(tc => tc.toolCallId === toolCall.toolCallId);
        if (idx === -1) {
          toolCalls.push(toolCall);
        } else {
          toolCalls[idx] = toolCall;
        }
        updateAssistantMessage({ role: 'assistant', toolCalls }, thread);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      LogService.log(error as Error, { component: "useStreamingMessage", function: "handleToolCalls" }, "error");
    }
  }, [updateAssistantMessage]);

  const handleStream = useCallback(async (
    textStream: AsyncIterable<string>,
    reasoningStream: AsyncIterable<string>,
    thread: Thread,
  ) => {
    try {
      const lastMessage = thread.messages[thread.messages.length - 1];
      let content = (typeof lastMessage?.content === 'string' ? lastMessage.content : '') ?? '';
      let reasoning = '';
      let chunkCount = 0;

      const processReasoning = async () => {
        for await (const chunk of reasoningStream) {
          if (!chunk) continue;
          reasoning += chunk;
          updateAssistantMessage({ role: 'assistant', reasoning }, thread);
        }
      };

      const processText = async () => {
        for await (const chunk of textStream) {
          chunkCount++;
          content += chunk;
          
          if (tts.isSupported) {
            if (chunkCount === 1) await tts.streamText(" ");
            tts.streamText(chunk);
          }
          
          updateAssistantMessage({ content, role: 'assistant' }, thread);
        }
      };

      await Promise.allSettled([processReasoning(), processText()]);

      if (tts.isSupported) {
        await tts.streamText("");
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ModelNotFoundException) throw error;

      console.log("Stream handling error:", error);
      handleStreamError(error);
      LogService.log(error as Error, { component: "useStreamingMessage", function: "handleStream" }, "error");
    }
  }, [tts, updateAssistantMessage]);

  return {
    updateAssistantMessage,
    flush,
    handleToolCalls,
    handleStream,
    stopStreaming: tts.stopStreaming,
    isSupported: tts.isSupported,
  };
}

function handleStreamError(error: unknown) {
  const err = error as { error?: { lastError?: { responseBody?: string } } };
  const vercelErrorResponse = err?.error?.lastError?.responseBody;
  
  if (vercelErrorResponse) {
    try {
      const json = JSON.parse(vercelErrorResponse);
      toastService.warning({
        title: "Error",
        description: json.error.charAt(0).toUpperCase() + json.error.slice(1),
      });
    } catch {
      toastService.danger({ title: "Error", description: vercelErrorResponse });
    }
  }
}
