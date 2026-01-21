import { Character, ChatMessage, Model, Provider } from "@/src/types/core";
import { ChatProvider } from "@/src/types/chat";
import { getProxyUrl } from "@/src/utils/proxy";

export class OpenRouterProvider implements ChatProvider {
  provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.provider.apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://compass-ai.chat",
      "X-Title": "Compass AI Chat",
    };
  }

  async sendMessage(
    messages: ChatMessage[],
    model: Model,
    character?: Character,
    signal?: AbortSignal
  ): Promise<AsyncIterable<string>> {
    const url = await getProxyUrl(`${this.provider.endpoint}/chat/completions`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: model.id,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    return this.createTextStream(response);
  }

  private async *createTextStream(response: Response): AsyncIterable<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async sendSimpleMessage(
    message: string,
    model: Model,
    systemPrompt: string
  ): Promise<string> {
    const url = await getProxyUrl(`${this.provider.endpoint}/chat/completions`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async sendJSONMessage(
    message: string,
    model: Model,
    systemPrompt: string
  ): Promise<any> {
    const url = await getProxyUrl(`${this.provider.endpoint}/chat/completions`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  async embedText(texts: string[]): Promise<number[][]> {
    // OpenRouter doesn't support embeddings directly
    return [];
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const url = await getProxyUrl(`${this.provider.endpoint}/models`);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("Failed to fetch OpenRouter models:", response.status);
        return [];
      }

      const data = await response.json();
      
      // OpenRouter returns models with additional metadata
      // Filter to only chat models and return their IDs
      return data.data
        .filter((model: any) => {
          // Include models that support chat/completion
          return model.id && !model.id.includes("embedding");
        })
        .map((model: any) => model.id)
        .slice(0, 100); // Limit to first 100 models to avoid overwhelming the UI
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      return [];
    }
  }
}
