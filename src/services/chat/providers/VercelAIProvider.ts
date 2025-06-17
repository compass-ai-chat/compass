import { ChatProvider } from '@/src/types/chat';
import { Character, Provider } from '@/src/types/core';
import { ChatMessage, Model } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { CoreMessage, CoreUserMessage, createDataStream, embedMany, StreamData, streamText, tool, ToolSet } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform as PlatformCust } from '@/src/utils/platform';
import { streamOpenAIResponse } from '@/src/services/chat/streamUtils';
import { z } from 'zod';
import { getProxyUrl } from '@/src/utils/proxy';
import { Cache } from '@/src/utils/cache';
import { createOllama } from 'ollama-ai-provider-v2';
import { createGroq } from '@ai-sdk/groq';
import { createXai } from '@ai-sdk/xai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { useTools } from '@/src/hooks/useTools';

export function useVercelAIProvider() {

    const { getVercelCompatibleToolSet } = useTools();

  const createProvider = (provider: any, modelId: string) => {
    let aiModel;

    switch (provider.name.toLowerCase()) {
      case 'ollama':
        console.log('ollama endpoint', provider.endpoint + '/api');
        aiModel = createOllama({
          baseURL: provider.endpoint + '/api',
        })(modelId);
        break;
      case 'openai':
        aiModel = createOpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.endpoint + '/v1',
        })(modelId);
        break;
      case 'groq':
        aiModel = createGroq({
          apiKey: provider.apiKey,
          baseURL: provider.endpoint + '/openai/v1',
        })(modelId);
        break;
      case 'xai':
        aiModel = createXai({
          apiKey: provider.apiKey,
          baseURL: provider.endpoint + '/v1',
        })(modelId);
        break;
      case 'anthropic':
        aiModel = createAnthropic({
          apiKey: provider.apiKey,
          baseURL: provider.endpoint + '/v1',
        })(modelId);
        break;
      case 'polaris':
        aiModel = createOpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.endpoint + '/api/v1',
        })(modelId);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }

    if (!aiModel) {
      throw new Error('Failed to initialize AI model provider');
    }

    return aiModel;
  }

  const sendMessage = async (messages: ChatMessage[], model: Model, character: Character|undefined, signal?: AbortSignal): Promise<AsyncIterable<string>> => {
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

    let toolSchemas: ToolSet | undefined;
    if(character?.toolIds){
      toolSchemas = await getVercelCompatibleToolSet(character.toolIds);
    }

    // if character has documents, add document search tool
    if(character?.documentIds?.length && character.documentIds.length > 0){
      console.log("Adding document search tool");
      toolSchemas = {
        ...toolSchemas,
        ...(await getVercelCompatibleToolSet(["DocumentSearch"]))
      }
    }

    console.log("Tool schemas", toolSchemas);


    try {
        const provider = createProvider(model.provider, model.id);

        const {textStream} = streamText({
            model: provider,
            messages: newMessages as CoreUserMessage[],
            tools: toolSchemas,
            maxSteps: 3,
            toolChoice: 'auto',
            onChunk: (chunk) => {
              if(chunk.chunk.type == 'tool-call'){
                //console.log('tool call', chunk.chunk.toolName);
              }
              else{
                //console.log('chunk', chunk);
              }
            }
        });

        return textStream;
    } catch (error: any) {
      LogService.log(error, { component: 'OpenAIProvider', function: 'sendMessage' }, 'error');
      throw error;
    }
  }

  return {
    sendMessage
  }
} 