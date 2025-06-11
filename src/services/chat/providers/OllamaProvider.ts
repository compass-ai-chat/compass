import { ChatProvider } from '@/src/types/chat';
import { Character, Provider } from '@/src/types/core';
import { ChatMessage } from '@/src/types/core';
import { Model } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { toastService } from '@/src/services/toastService';
import { CoreMessage, embedMany, generateText, streamText, tool } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { fetch as expoFetch } from 'expo/fetch';
import { z } from 'zod';
import { getProxyUrl } from '@/src/utils/proxy';
import { embed } from 'ai';



import {Platform as PlatformCust} from '@/src/utils/platform';
import {streamOllamaResponse} from '@/src/services/chat/streamUtils';


export class OllamaProvider implements ChatProvider {
  provider: Provider;
  constructor(provider: Provider) {
    this.provider = provider;
  }
  async sendMessage(messages: ChatMessage[], model: Model, character?: Character, signal?: AbortSignal): Promise<AsyncIterable<string>> {
    const newMessages = [
      ...messages.map(message => ({ 
        role: message.isUser ? 'user' : message.isSystem ? 'system' : 'assistant', 
        content: message.content 
      }))
    ];

    // if latest message is empty
    if(newMessages[newMessages.length-1].content.trim() === ''){
      newMessages.pop();
    }

    try{
      if(PlatformCust.isMobile){
        let url = `${model.provider.endpoint}/api/chat`;
        if(PlatformCust.isTauri) url = await getProxyUrl(url);
        return streamOllamaResponse(url, {
          model: model.id,
          messages: newMessages,
          stream: true
        });
      }
      else{

        const ollama = createOllama({
          // optional settings, e.g.
          baseURL: await getProxyUrl(model.provider.endpoint+'/api'),
          fetch: expoFetch as unknown as typeof globalThis.fetch,
          
        });

        const { textStream, steps } = streamText({
          model: ollama(model.id),
          messages: newMessages as CoreMessage[],
          onError: (error) => {
            throw error;
          },
          // tools: {
          //   weather: tool({
          //     description: 'Get the weather in a location (celsius)',
          //     parameters: z.object({
          //       location: z.string().describe('The location to get the weather for'),
          //     }),
          //     execute: async ({ location }) => {
          //       console.log("location", location);
          //       const temperature = 21.69;
          //       return `${temperature} degrees celsius`;
          //     },
          //   }),
          // },
          // toolChoice: 'auto',
          // maxSteps: 5
        }
      );

        return textStream;

      }
      
    }
    catch(error:any){
      LogService.log(error, {component: 'OllamaProvider', function: `sendMessage: ${model.provider.endpoint}`}, 'error');
      throw error;
    }
  }


  async sendSimpleMessage(message: string, model: Model, systemPrompt: string): Promise<string> {
    let url = `${model.provider.endpoint}/api/chat`;
    if(PlatformCust.isTauri) url = await getProxyUrl(url);

    try{
      if(!PlatformCust.isMobile){
        const ollama = createOllama({
          // optional settings, e.g.
          baseURL: model.provider.endpoint+'/api',
          fetch: expoFetch as unknown as typeof globalThis.fetch,
        });
  
        const result = await generateText({
          model: ollama(model.id),
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }]
        });
  
        return result.text;
      }
    }
    catch(error:any){
      if(error.errors){
        const errorMessage = JSON.parse(error.errors[0]?.responseBody || '{}').error;
        throw new Error(errorMessage);
      }
      throw error;
    }
    

    if(PlatformCust.isTauri) url = await getProxyUrl(url);
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
        stream: false
      }),
    });
    let data = await response.json();
    if(!data?.message){
      throw new Error(`Unexpected format: ${data}`);
    }
    return data.message.content;
  }

  
  async sendJSONMessage(message: string, model: Model, systemPrompt: string): Promise<any>{
    let url = `${model.provider.endpoint}/api/chat`;
    let response = await fetch(await getProxyUrl(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
          stream: false,
          format: 'json'
        }),
      });
      let data = await response.json();
    
    try{
      return JSON.parse(data.message.content);
    } catch (error) {
      return {query: "", searchRequired: false};
    }
  }

  async embedText(texts: string[]): Promise<number[][]> {
    let url = `${this.provider.endpoint}/api/embed`;
    if(PlatformCust.isTauri) url = await getProxyUrl(url);

    const ollama = createOllama({
      // optional settings, e.g.
      baseURL: await getProxyUrl(this.provider.endpoint+'/api'),
      fetch: expoFetch as unknown as typeof globalThis.fetch,
    });
    
    const { embeddings } = await embedMany({
      model: ollama.embedding('all-minilm'),
      values: texts,
    });

    return embeddings;

  }

  async getAvailableModels(): Promise<string[]> {

    const ollamaResponse = await fetch(await getProxyUrl(`${this.provider.endpoint}/api/tags`), {
      headers: {
        'Accept': 'application/json',
      }
    });
    const ollamaData = await ollamaResponse.json();
    
    if (!(ollamaData && Array.isArray(ollamaData.models))) return [];
    return ollamaData.models
      .filter((model: any) => model && typeof model.name === 'string' && model.details.family != 'bert')
      .map((model: any) => model.name);
  }
} 