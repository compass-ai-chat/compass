import { ChatProvider } from '@/src/types/chat';
import { Character, Provider } from '@/src/types/core';
import { ChatMessage } from '@/src/types/core';
import { Model } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { Platform } from 'react-native';
import { groq } from '@ai-sdk/groq';
import { createGroq } from '@ai-sdk/groq';
import { CoreMessage, embedMany, generateText, tool } from 'ai';
import { streamText } from 'ai';
import { z } from 'zod';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform as PlatformCust } from '@/src/utils/platform';
import { getProxyUrl } from '@/src/utils/proxy';
import { Cache } from '@/src/utils/cache';

export class GroqProvider implements ChatProvider {
  provider: Provider;
  private CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private get modelsCacheKey() {
    return `models-cache-groq-${this.provider.endpoint}`;
  }

  constructor(provider: Provider) {
    this.provider = provider;
  }
  async sendMessage(messages: ChatMessage[], model: Model, character: Character, signal?: AbortSignal): Promise<AsyncIterable<string>> {
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

    try {
      
      const groq = createGroq({
        baseURL: model.provider.endpoint+'/openai/v1',
        apiKey: model.provider.apiKey,
        fetch: expoFetch as unknown as typeof globalThis.fetch
      });

      const {text, steps} = await generateText({
        model: groq(model.id),
        messages: newMessages as CoreMessage[],
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
      });

      return new ReadableStream({
        async start(controller) {
          controller.enqueue(text);
          controller.close();
        }
      });

      // for await (const textPart of textStream) {
      //   yield textPart;
      // }
    } catch (error: any) {
      LogService.log(error, { component: 'OpenAIProvider', function: 'sendMessage' }, 'error');
      throw error;
    }
  }

  async sendSimpleMessage(message: string, model: Model, systemPrompt: string): Promise<string> {
    const groq = createGroq({
      baseURL: model.provider.endpoint+'/openai/v1',
      apiKey: model.provider.apiKey,
      fetch: expoFetch as unknown as typeof globalThis.fetch
    });

    const {text, steps} = await generateText({
      model: groq(model.id),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    });

    return text;
  }

  async sendJSONMessage(message: string, model: Model, systemPrompt: string): Promise<any> {
    let url = `${model.provider.endpoint}`;
    if(PlatformCust.isMobile) url = await getProxyUrl(url);
    const response = await fetch(url+"/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.provider.apiKey}`
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: false,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      return { query: "", searchRequired: false };
    }
  }

  async embedText(texts: string[]): Promise<number[][]> {
    // anthropic does not support embedding
    return [];
  }

  async getAvailableModels(): Promise<string[]> {
    return Cache.withCache(
      `models-cache-groq-${this.provider.endpoint}`,
      async () => {
        const response = await fetch(`${this.provider.endpoint}/openai/v1/models`, {
          headers: {
            'Authorization': `Bearer ${this.provider.apiKey}`
          }
        });
        const data = await response.json();
        return data.data
          .filter((model: any) => model.object == 'model' && model.active == true)
          .map((model: any) => model.id);
      },
      5 * 60 * 1000 // 5 minutes
    );
  }
} 