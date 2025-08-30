import { Tool } from '@/src/types/tools';

export interface ToolConfig {
  id: string;
  category: 'search' | 'utility' | 'thinking' | 'custom';
  supportedProviders?: string[];
  supportedModels?: string[];
  requiresModelCheck?: boolean;
  icon?: string;
  description?: string;
}

export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  WebSearch: {
    id: 'WebSearch',
    category: 'search',
    icon: 'globe-outline',
    description: 'Real-time web search capabilities'
  },
  Calculator: {
    id: 'Calculator',
    category: 'utility',
    icon: 'calculator-outline',
    description: 'Mathematical calculations'
  },
  Weather: {
    id: 'Weather',
    category: 'utility',
    icon: 'partly-sunny-outline',
    description: 'Weather information'
  },
  LengthConverter: {
    id: 'LengthConverter',
    category: 'utility',
    icon: 'resize-outline',
    description: 'Length unit conversion'
  },
  WeightConverter: {
    id: 'WeightConverter',
    category: 'utility',
    icon: 'scale-outline',
    description: 'Weight unit conversion'
  },
  Email: {
    id: 'Email',
    category: 'utility',
    icon: 'mail-outline',
    description: 'Email composition and sending'
  },
  Note: {
    id: 'Note',
    category: 'utility',
    icon: 'document-text-outline',
    description: 'Note taking and management'
  },
  Thinking: {
    id: 'Thinking',
    category: 'thinking',
    supportedProviders: ['Ollama'],
    supportedModels: ['qwen'],
    requiresModelCheck: true,
    icon: 'lightbulb',
    description: 'Enable thinking capabilities'
  },
  DocumentSearch: {
    id: 'DocumentSearch',
    category: 'search',
    icon: 'document-search-outline',
    description: 'Search through uploaded documents'
  },
  ImageGeneration: {
    id: 'ImageGeneration',
    category: 'custom',
    icon: 'image-outline',
    description: 'Generate images from text descriptions'
  },
  // Example of how to add a new tool easily:
  // CurrencyConverter: {
  //   id: 'CurrencyConverter',
  //   category: 'utility',
  //   icon: 'cash-outline',
  //   description: 'Convert between different currencies'
  // },
  // Translation: {
  //   id: 'Translation',
  //   category: 'utility',
  //   supportedProviders: ['OpenAI', 'Anthropic'],
  //   icon: 'language-outline',
  //   description: 'Translate text between languages'
  // }
};

export const getToolConfig = (toolId: string): ToolConfig | undefined => {
  return TOOL_CONFIGS[toolId];
};

export const isToolSupportedForModel = (toolId: string, model?: any): boolean => {
  const config = getToolConfig(toolId);
  if (!config) return true; // Default to supported if no config

  // Check provider support
  if (config.supportedProviders && model?.provider?.name) {
    const providerSupported = config.supportedProviders.some(provider => 
      model.provider.name.toLowerCase().includes(provider.toLowerCase())
    );
    if (!providerSupported) return false;
  }

  // Check model support
  if (config.supportedModels && model?.name) {
    const modelSupported = config.supportedModels.some(supportedModel => 
      model.name.toLowerCase().includes(supportedModel.toLowerCase())
    );
    if (!modelSupported) return false;
  }

  return true;
};

export const getToolCategory = (toolId: string): string => {
  const config = getToolConfig(toolId);
  return config?.category || 'custom';
};

export const getToolIcon = (toolId: string): string => {
  const config = getToolConfig(toolId);
  return config?.icon || 'code';
};

export const getToolDescription = (toolId: string): string => {
  const config = getToolConfig(toolId);
  return config?.description || 'Custom tool';
};

// Helper function to add new tools programmatically
export const addToolConfig = (toolConfig: ToolConfig) => {
  TOOL_CONFIGS[toolConfig.id] = toolConfig;
};

// Helper function to get all tools by category
export const getToolsByCategory = () => {
  const categories: Record<string, ToolConfig[]> = {
    search: [],
    utility: [],
    thinking: [],
    custom: []
  };

  Object.values(TOOL_CONFIGS).forEach(config => {
    categories[config.category].push(config);
  });

  return categories;
};
