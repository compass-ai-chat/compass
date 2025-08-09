import { ChatMessage, MessageRole } from "@/src/types/core";

export function getMessageRole(message: ChatMessage): MessageRole {
  if (message.role) return message.role;
  if (message.role == 'user') return "user";
  if (message.isSystem) return "system";
  return "assistant";
}

export function withNormalizedRole<T extends ChatMessage>(message: T): T {
  const role = getMessageRole(message);
  return {
    ...message,
    role,
    // Keep legacy flags in sync if they were present
    isUser: role === "user" ? true : message.role == 'user' ? false : undefined,
    isSystem: role === "system" ? true : message.isSystem ? false : undefined,
  } as T;
}

export function isUserMessage(message: ChatMessage): boolean {
  return getMessageRole(message) === "user";
}

export function isSystemMessage(message: ChatMessage): boolean {
  return getMessageRole(message) === "system";
}

export function isAssistantMessage(message: ChatMessage): boolean {
  return getMessageRole(message) === "assistant";
} 