import { ChatProvider } from "@/src/types/chat";
import { Character, Provider } from "@/src/types/core";
import { ChatMessage } from "@/src/types/core";
import { Model } from "@/src/types/core";
import LogService from "@/utils/LogService";
import { toastService } from "@/src/services/toastService";
import { CoreMessage, embedMany, generateText, streamText, tool } from "ai";
import { createOllama } from "ollama-ai-provider";
import { fetch as expoFetch } from "expo/fetch";
import { z } from "zod";
import { getProxyUrl } from "@/src/utils/proxy";
import { embed } from "ai";
import { Cache } from '@/src/utils/cache';

import { Platform as PlatformCust } from "@/src/utils/platform";
import { streamPolarisResponse } from "@/src/services/chat/streamUtils";
import { ModelNotFoundException } from "@/src/services/chat/streamUtils";

export class PolarisProvider implements ChatProvider {
  provider: Provider;
  constructor(provider: Provider) {
    this.provider = provider;
  }
  async sendMessage(
    messages: ChatMessage[],
    model: Model,
    character: Character,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<string>> {
    const newMessages = [
      ...messages.map((message) => ({
        role: message.isUser
          ? "user"
          : message.isSystem
            ? "system"
            : "assistant",
        content: message.content,
      })),
    ];

    // if latest message is empty
    if (newMessages[newMessages.length - 1].content.trim() === "") {
      newMessages.pop();
    }

    try {
      let url = `${model.provider.endpoint}/api/chat/stream`;
      if (PlatformCust.isTauri) url = await getProxyUrl(url);
      console.log("Sending request to", url);
      
      // Track tool call results to include in the response
      const toolCallResults: string[] = [];
      
      return streamPolarisResponse(
        url,
        {
          model: model.id,
          messages: newMessages,
          stream: true,
        },
        {
          Authorization: `Bearer ${this.provider.apiKey}`,
        },
        // Add a callback to handle tool call results
        (chunk: any) => {
          // Check if this is a tool call result
          if (chunk && chunk.toolCallId && chunk.result) {
            if (chunk.result.message) {
              console.log("Tool call result", chunk.result.message);
              toolCallResults.push(chunk.result.message);
              return null;
            }
          }
          return null;
        },
        signal
      );
      
      // If we have tool call results, yield them
      if (toolCallResults.length > 0) {
        console.log("Tool call results", toolCallResults);
        for (const result of toolCallResults) {
          //yield result;
        }
      }
    } catch (error: any) {
      // Rethrow ModelNotFoundException to be handled by useChat
      if (error instanceof ModelNotFoundException) {
        throw error;
      }
      
      LogService.log(
        error,
        {
          component: "PolarisProvider",
          function: `sendMessage: ${model.provider.endpoint}`,
        },
        "error",
      );
      throw error;
    }
  }

  async sendSimpleMessage(message: string, model: Model, systemPrompt: string): Promise<string> {
    let url = `${model.provider.endpoint}`;
    if(PlatformCust.isMobile) url = await getProxyUrl(url);
    const response = await fetch(url+"/api/v1/chat/completions", {
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
    if(!data.choices) {
      throw new Error(`Unexpected format: ${data}`);
    }
    return data.choices[0].message.content;
  }

  async sendJSONMessage(message: string, model: Model, systemPrompt: string): Promise<any> {
    let url = `${model.provider.endpoint}`;
    if(PlatformCust.isMobile) url = await getProxyUrl(url);
    const response = await fetch(url+"/api/v1/chat/completions", {
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
    let url = `${this.provider.endpoint}/api/embed`;
    if (PlatformCust.isTauri) url = await getProxyUrl(url);

    const ollama = createOllama({
      // optional settings, e.g.
      baseURL: await getProxyUrl(this.provider.endpoint + "/api"),
      fetch: expoFetch as unknown as typeof globalThis.fetch,
    });

    const { embeddings } = await embedMany({
      model: ollama.embedding("all-minilm"),
      values: texts,
    });

    return embeddings;
  }

  async getAvailableModels(): Promise<string[]> {
    return Cache.withCache(
      `models-cache-openai-${this.provider.endpoint}`,
      async () => {
        const openaiResponse = await fetch(`${this.provider.endpoint}/api/v1/models`, {
          headers: {
            'Authorization': `Bearer ${this.provider.apiKey}`
          }
        });
        const openaiData = await openaiResponse.json();
        return openaiData.data
          .map((model: any) => model.id);
      },
      5 * 60 * 1000 // 5 minutes
    );
  }
}
