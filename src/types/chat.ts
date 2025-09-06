import { MentionedCharacter } from "@/src/components/chat/ChatInput";
import { Character, Provider, Thread } from "@/src/types/core";

import { ChatMessage } from "@/src/types/core";

import { Model, Document } from "@/src/types/core";

export interface ChatProvider {
  provider: Provider;
  sendMessage(messages: ChatMessage[], model: Model, character?: Character, signal?: AbortSignal): Promise<AsyncIterable<string>>;
  sendSimpleMessage(message: string, model: Model, systemPrompt: string): Promise<string>;
  sendJSONMessage(message: string, model: Model, systemPrompt: string): Promise<any>;
  embedText(texts: string[]): Promise<number[][]>;
  getAvailableModels(): Promise<string[]>;
}

export interface MessageStreamHandler {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface ChatContextManager {
  prepareContext(message: string, currentThread: Thread, mentionedCharacters: MentionedCharacter[], mentionedDocuments: Document[], images?: string[]): {
    messagesToSend: ChatMessage[];
    assistantPlaceholder: ChatMessage;
    characterToUse: Character | undefined;
    mentionedDocuments: Document[];
  };
} 