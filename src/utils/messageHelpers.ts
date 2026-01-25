import { ModelMessage } from "@ai-sdk/provider-utils";
import { ChatMessage } from "@/src/types/core";

/**
 * Utility functions to help with the ModelMessage migration
 * These handle the transition from simple string content to structured content
 */

/**
 * Safely extract text content from a ModelMessage or ChatMessage
 */
export function getMessageTextContent(message: ChatMessage | ModelMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    // Extract text from content parts
    return message.content
      .map(part => {
        if ('text' in part && part.type === 'text') {
          return part.text;
        }
        return '';
      })
      .join('');
  }
  
  return '';
}

/**
 * Create a simple text message in the correct ModelMessage format
 */
export function createTextMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  customFields?: Partial<ChatMessage>
): ChatMessage {
  const baseMessage: ModelMessage = {
    role,
    content
  };

  return {
    ...baseMessage,
    ...customFields
  } as ChatMessage;
}

/**
 * Safely update message content while preserving the correct format
 */
export function updateMessageContent(
  message: ChatMessage,
  newContent: string
): ChatMessage {
  return {
    ...message,
    content: newContent
  };
}

/**
 * Check if content is purely text (helps with type guards)
 */
export function isTextContent(content: any): content is string {
  return typeof content === 'string';
}
