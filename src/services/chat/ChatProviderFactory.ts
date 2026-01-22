import { Model, Provider } from '@/src/types/core';
import { ChatProvider } from '@/src/types/chat';
import { OllamaProvider } from './providers/OllamaProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GroqProvider } from './providers/GroqProvider';
import { CerebrasProvider } from './providers/CerebrasProvider';
import { MistralProvider } from './providers/MistralProvider';
import { XAIProvider } from './providers/XAIProvider';
import { PolarisProvider } from './providers/PolarisProvider';
export class ChatProviderFactory {
  static getProvider(provider: Provider): ChatProvider {
    switch (provider.name) {
      case 'Ollama':
        return new OllamaProvider(provider);
      case 'Polaris':
        return new PolarisProvider(provider);
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }
} 