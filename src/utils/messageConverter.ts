import { ModelMessage } from "@ai-sdk/provider-utils";
import { ChatMessage } from "@/src/types/core";

/**
 * Converts our ChatMessage format to Vercel AI's ModelMessage format
 * This centralizes the conversion logic that was duplicated across all providers
 */
export const convertToModelMessage = (message: ChatMessage): ModelMessage => {
  // If message has images in our legacy format, convert to ModelMessage format
  if (message.images && message.images.length > 0) {
    const parts: any[] = [];
    
    // Add image parts
    message.images.forEach(image => {
      parts.push({
        type: "image",
        image: image
      });
    });

    // Add text content if present
    if (message.content && typeof message.content === 'string' && message.content.trim()) {
      parts.push({ type: "text", text: message.content });
    }

    return {
      role: message.role,
      content: parts,
      ...(message.providerOptions && { providerOptions: message.providerOptions })
    } as ModelMessage;
  }

  // Return clean ModelMessage without our custom fields
  return {
    role: message.role,
    content: message.content,
    ...(message.providerOptions && { providerOptions: message.providerOptions })
  } as ModelMessage;
};

/**
 * Converts an array of ChatMessages to ModelMessages and removes empty messages
 */
export const convertMessagesToModelMessages = (messages: ChatMessage[]): ModelMessage[] => {
  const processedMessages = messages.map(convertToModelMessage);
  
  // Check if latest message is empty and remove it
  const lastMessage = processedMessages[processedMessages.length - 1];
  if (lastMessage && 
      ((typeof lastMessage.content === 'string' && lastMessage.content.trim() === "") ||
       (Array.isArray(lastMessage.content) && lastMessage.content.length === 0))) {
    processedMessages.pop();
  }
  
  return processedMessages;
};
