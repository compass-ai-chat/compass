import { ChatMessage } from "@/src/types/core";

export function getMessageRole(message: ChatMessage) {
  return message.role;
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