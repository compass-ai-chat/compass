import { MentionedCharacter } from '@/src/components/chat/ChatInput';
import { ChatContextManager } from '@/src/types/chat';
import { ChatMessage, Character, Document } from '@/src/types/core';
import { Thread } from '@/src/types/core';

export class CharacterContextManager implements ChatContextManager {
  prepareContext(message: string, currentThread: Thread, mentionedCharacters: MentionedCharacter[], mentionedDocuments: Document[]): { messagesToSend: ChatMessage[]; historyToSend: ChatMessage[]; assistantPlaceholder: ChatMessage; useMention: boolean; characterToUse: Character | undefined, mentionedDocuments: Document[] } {
    const newMessage = { content: message, role: 'user' };
    let assistantPlaceholder: ChatMessage = { content: "", role: 'assistant' };
    let messagesToSend: ChatMessage[] = [];

    if (mentionedCharacters.length > 0) {
      const contextMessage = this.buildContextMessage(currentThread);
      assistantPlaceholder = { 
        content: '', 
        role: 'assistant',
        character: mentionedCharacters[0].character 
      };
      messagesToSend = [
        { content: contextMessage, role: 'system' },
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
          historyToSend.push({ content: `${message.character.name} responded: "${message.content}"`, role: 'system' });
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
        : currentThread.character,
      mentionedDocuments
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