import { ChatProvider } from '@/src/types/chat';
import { Character, Provider } from '@/src/types/core';
import { ChatMessage, Model } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { CoreMessage, createDataStream, embedMany, StreamData, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform as PlatformCust } from '@/src/utils/platform';
import { streamOpenAIResponse } from '@/src/services/chat/streamUtils';
import { z } from 'zod';
import { getProxyUrl } from '@/src/utils/proxy';

export class OpenAIProvider implements ChatProvider {
  provider: Provider;
  constructor(provider: Provider) {
    this.provider = provider;
  }
  async *sendMessage(messages: ChatMessage[], model: Model, character: Character, signal?: AbortSignal): AsyncGenerator<string> {
    const newMessages = [
      { role: 'system', content: character.content },
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
      if (PlatformCust.isMobile) {
        let url = `${model.provider.endpoint}/v1/chat/completions`;
        if (PlatformCust.isTauri) url = await getProxyUrl(url);
        yield* streamOpenAIResponse(url, {
          model: model.id,
          messages: newMessages,
          stream: true,
        }, {
          headers:{
          'Authorization': `Bearer ${model.provider.apiKey}`
        }
      });
      } else {
        const openai = createOpenAI({
          baseURL: model.provider.endpoint+'/v1',
          apiKey: model.provider.apiKey,
          fetch: expoFetch as unknown as typeof globalThis.fetch
        });

        const {textStream, steps} = streamText({
          model: openai(model.id),
          messages: newMessages as CoreMessage[],
          tools: {
            weather: tool({
              description: 'Get the weather in a location (celsius)',
              parameters: z.object({
                location: z.string().describe('The location to get the weather for'),
              }),
              execute: async ({ location }) => {
                console.log("location", location);
                const temperature = 21.69;
                return `${temperature} degrees celsius`;
              },
            }),
          },
          toolChoice: 'auto',
          maxSteps: 5
        });

        for await (const textPart of textStream) {
          yield textPart;
        }
      }
    } catch (error: any) {
      LogService.log(error, { component: 'OpenAIProvider', function: 'sendMessage' }, 'error');
      throw error;
    }
  }

  async sendSimpleMessage(message: string, model: Model, systemPrompt: string): Promise<string> {
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
        stream: false
      }),
    });

    const data = await response.json();
    console.log("endpoint", model.provider.endpoint);
    if(!data.choices) {
      throw new Error(`Unexpected format: ${data}`);
    }
    return data.choices[0].message.content;
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
    const openai = createOpenAI({
      baseURL: this.provider.endpoint+'/v1',
      apiKey: this.provider.apiKey,
      fetch: expoFetch as unknown as typeof globalThis.fetch
    });

    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: texts,
    });

    return embeddings;
  }

  async getAvailableModels(): Promise<string[]> {
    const openaiResponse = await fetch(`${this.provider.endpoint}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${this.provider.apiKey}`
      }
    });
    const openaiData = await openaiResponse.json();
    return openaiData.data
      .filter((model: any) => model.id.includes('gpt'))
      .map((model: any) => model.id);
  }
} 