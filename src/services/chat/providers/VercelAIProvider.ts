import { Character, Provider } from '@/src/types/core';
import { ChatMessage, Model } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { CoreMessage, CoreUserMessage, createDataStream, embedMany, generateObject, generateText, StreamData, streamText, tool, ToolSet } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { Platform } from '@/src/utils/platform';
import { createOllama } from 'ollama-ai-provider-v2';
import { createGroq } from '@ai-sdk/groq';
import { createXai } from '@ai-sdk/xai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { useTools } from '@/src/hooks/useTools';
import { z } from 'zod';
import { SimpleSchema, simpleSchemaToZod } from '@/src/utils/zodHelpers';
import { hotToolsAtom, thinkingActiveAtom } from '@/src/hooks/atoms';
import { useAtom } from 'jotai';

export interface ToolCall {
  toolName: string;
  toolCallId: string;
  args: any;
  toolId?: string;
}

export interface StreamResponse {
  textStream: AsyncIterable<string>;
  toolCallStream: AsyncIterable<ToolCall>;
  reasoningStream: AsyncIterable<string>;
}

export function useVercelAIProvider() {

  const { getVercelCompatibleToolSet } = useTools();
  const [hotTools, setHotTools] = useAtom(hotToolsAtom);
  const [thinkingActive, setThinkingActive] = useAtom(thinkingActiveAtom);

  const createProvider = (provider: any, modelId: string) => {
    let aiModel;

    switch (provider.name.toLowerCase()) {
      case 'ollama':
        console.log('ollama endpoint', provider.endpoint + '/api');
        aiModel = createOllama({
          baseURL: provider.endpoint + '/api',
        })(modelId, {think: hotTools.includes('Thinking')});
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

  const generateJSON = async (prompt: string, schema: SimpleSchema, model: Model): Promise<any> => {
    const provider = createProvider(model.provider, model.id);
    const {object} = await generateObject({
      model: provider,
      prompt: prompt,
      schema: simpleSchemaToZod(schema)
    });

    return object;
  }

  const sendMessage = async (messages: ChatMessage[], model: Model, character?: Character, signal?: AbortSignal): Promise<StreamResponse> => {
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
    
    // Get the active tools from the last user message
    const lastMessage = messages[messages.length - 1];
    const activeTools = lastMessage.activeTools || [];

    let toolIds = [];

    if(character?.toolIds) toolIds.push(...character.toolIds);
    if (Array.from(hotTools).length>0) toolIds.push(...Array.from(hotTools));
    //if(character?.documentIds?.length && character.documentIds.length > 0) toolIds.push("DocumentSearch");

    if(toolIds.length > 0) {
      console.log("fetching for tools", toolIds);
      toolSchemas = await getVercelCompatibleToolSet(toolIds.filter(x=>x!="DocumentSearch"));
    }

    console.log("Tool schemas", toolSchemas);

    try {
        const provider = createProvider(model.provider, model.id);

        if(!Platform.isMobile){
          // Create controllers for both streams
          let textController!: ReadableStreamDefaultController<string>;
          let toolCallController!: ReadableStreamDefaultController<ToolCall>;
          let reasoningController!: ReadableStreamDefaultController<string>;
          
          const textStream = new ReadableStream<string>({
            start(controller) {
              textController = controller;
            }
          });
          
          const toolCallStream = new ReadableStream<ToolCall>({
            start(controller) {
              toolCallController = controller;
            }
          });

          const reasoningStream = new ReadableStream<string>({
            start(controller) {
              reasoningController = controller;
            }
          });

          const {textStream: originalTextStream} = streamText({
            model: provider,
            messages: newMessages as CoreUserMessage[],
            tools: toolSchemas,
            maxSteps: 3,
            toolChoice: 'auto',
            onChunk: (chunk) => {
              if(chunk.chunk.type == 'tool-call'){
                console.log('tool call', chunk.chunk);
                toolCallController.enqueue({
                  toolName: chunk.chunk.toolName,
                  toolCallId: chunk.chunk.toolCallId,
                  args: chunk.chunk.args, 
                  toolId: chunk.chunk.toolName
                });
              }
              else if(chunk.chunk.type == 'reasoning'){
                reasoningController.enqueue(chunk.chunk.textDelta);
              }
              else{
                console.log('chunk', chunk.chunk);
                //console.log('chunk', chunk);
              }
            },
            onFinish: () => {
              textController.close();
              toolCallController.close();
              reasoningController.close();
            },
            onError: (error) => {
              textController.error(error);
              toolCallController.error(error);
              reasoningController.error(error);
            }
          });

          // Forward text chunks to our custom text stream
          (async () => {
            try {
              for await (const content of originalTextStream) {
                textController.enqueue(content);
              }
            } catch (error) {
              textController.error(error);
            }
          })();

          return {
            textStream,
            toolCallStream,
            reasoningStream
          };
        }

        // For mobile, we use generateText which doesn't stream
        const {text, steps, reasoning} = await generateText({
          model: provider,
          messages: newMessages as CoreMessage[],
          tools: toolSchemas,
          maxSteps: 3,
          toolChoice: 'auto'
        });

        // Create streams that immediately provide the final result
        const textStream = new ReadableStream<string>({
          async start(controller) {
            controller.enqueue(text);
            controller.close();
          }
        });

        const reasoningStream = new ReadableStream<string>({
          async start(controller) {
            controller.enqueue(reasoning);
            controller.close();
          }
        });

        const toolCallStream = new ReadableStream<ToolCall>({
          async start(controller) {
            // Extract tool calls from steps if any
            if (steps) {
              for (const step of steps) {
                if (step.toolCalls) {
                  for (const toolCall of step.toolCalls) {
                    controller.enqueue({
                      toolName: toolCall.toolName,
                      toolCallId: toolCall.toolCallId,
                      args: toolCall.args
                    });
                  }
                }
              }
            }
            controller.close();
          }
        });

        return {
          textStream,
          toolCallStream,
          reasoningStream
        };
        
    } catch (error: any) {
      LogService.log(error, { component: 'OpenAIProvider', function: 'sendMessage' }, 'error');
      throw error;
    }
  }

  return {
    sendMessage,
    generateJSON
  }
} 