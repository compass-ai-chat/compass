import { ThreadAction } from '@/src/hooks/atoms';
import { MessageStreamHandler } from '@/src/types/chat';
import { Thread } from '@/src/types/core';
import { Readable } from 'stream';
import LogService from '@/utils/LogService';
import { toastService } from '../toastService';
import { ModelNotFoundException } from './streamUtils';

export class StreamHandlerService {
  constructor(private tts: any) {}

  async handleStream(
    response: AsyncIterable<string>,
    currentThread: Thread,
    dispatchThread: (action: ThreadAction) => Promise<void>,
    onComplete?: () => void
  ) {
    try {
      console.log("handling stream inside service", typeof response, response);
    
      let assistantMessage = currentThread.messages[currentThread.messages.length - 1].content;
      let chunkCount = 0;
      const isFirstMessage = currentThread.messages.length === 2;
    
      for await (const content of response) {
        chunkCount++;
        assistantMessage += content;
        await this.updateMessage(
          content,
          chunkCount,
          assistantMessage,
          currentThread,
          dispatchThread
        );
      }

      if (this.tts.isSupported) {
        await this.tts.streamText("");
      }

    } 
    catch(error:any){

      if(error instanceof ModelNotFoundException){
        throw error;
      }
      
      console.log('error', error);
      const vercelErrorResponse = error?.error?.lastError?.responseBody;
      if(vercelErrorResponse){
        try{
          const json = JSON.parse(vercelErrorResponse);
          toastService.warning({title: "Error", description: json.error.charAt(0).toUpperCase() + json.error.slice(1)});
        }
        catch(e){
          toastService.danger({title: "Error", description: vercelErrorResponse});
        }
      }
      LogService.log(error, {component: 'StreamHandlerService', function: `handleStream`}, 'error');
    }
    finally {
      onComplete?.();
    }
  }

  private async updateMessage(
    content: string,
    chunkCount: number,
    assistantMessage: string,
    currentThread: Thread,
    dispatchThread: (action: ThreadAction) => void
  ): Promise<void> {
    // Handle TTS if supported
    if (this.tts.isSupported) {
      if (chunkCount === 1) await this.tts.streamText(" ");
      this.tts.streamText(content);
    }

    // Update the thread with new content
    const updatedMessages = [...currentThread.messages];
    const lastMessage = updatedMessages[updatedMessages.length - 1];
    if (lastMessage && !lastMessage.isUser) {
      lastMessage.content = assistantMessage;
      dispatchThread({
        type: 'updateMessages',
        payload: {
          threadId: currentThread.id,
          messages: updatedMessages
        }
      });
      // RN has a debounce for rendering, so it's better to wait a bit before updating the message
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  

  // ... implement private methods for chunk processing and message updating
} 