import { MentionedCharacter } from '@/src/components/chat/ChatInput';
import { ChatContextManager } from '@/src/types/chat';
import { ChatMessage, Character } from '@/src/types/core';
import { Thread } from '@/src/types/core';

export class CharacterContextManager implements ChatContextManager {
  prepareContext(message: string, currentThread: Thread, mentionedCharacters: MentionedCharacter[]): { messagesToSend: ChatMessage[]; historyToSend: ChatMessage[]; assistantPlaceholder: ChatMessage; useMention: boolean; characterToUse: Character | undefined } {
    const newMessage = { content: message, isUser: true };
    let assistantPlaceholder: ChatMessage = { content: "", isUser: false };
    let messagesToSend: ChatMessage[] = [];

    if (mentionedCharacters.length > 0) {
      const contextMessage = this.buildContextMessage(currentThread);
      assistantPlaceholder = { 
        content: '', 
        isUser: false, 
        character: mentionedCharacters[0].character 
      };
      messagesToSend = [
        { content: contextMessage, isUser: false,isSystem: true },
        newMessage
      ];
    } else {
      messagesToSend = [newMessage];
    }
    
    let historyToSend: ChatMessage[] = [];
    // any character messages should be inserted before the user's last message as system message
    for (let i = 0; i < currentThread.messages.length; i++) {
        const message = currentThread.messages[i];
        if (message.character && historyToSend.length > 0) {
          historyToSend.push({ content: `${message.character.name} responded: "${message.content}"`, isUser: false, isSystem: true });
        } 
        else{
          historyToSend.push(message);
        }
    }

    return {
      messagesToSend,
      historyToSend,
      assistantPlaceholder,
      useMention: mentionedCharacters.length > 0,
      characterToUse: mentionedCharacters.length > 0 
        ? mentionedCharacters[0].character 
        : currentThread.character
    };
  }

  private buildContextMessage(thread: Thread): string {
    if (thread.messages.length < 2 || !thread.character) {
      return ``;
    }

    const userLastMessage = thread.messages[thread.messages.length - 2];
    const assistantLastMessage = thread.messages[thread.messages.length - 1];
    
    return `User told ${thread.character.name} "${userLastMessage.content}" and they responded with "${assistantLastMessage.content}"`;
  }
} 