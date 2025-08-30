# Tool System Documentation

This document explains how the tool system works and how to add new tools to the application.

## Overview

The tool system is designed to be elegant, simple, and reusable. It integrates seamlessly with the chat system, streaming, and atom state management.

## Architecture

### Core Components

1. **Tool Configuration** (`toolConfig.ts`) - Defines tool metadata, categories, and support rules
2. **Tool Registry** (`useTools.ts`) - Manages tool registration, execution, and state
3. **Tool Menu** (`ToolsMenu.tsx`) - UI component for tool selection
4. **Tool Providers** - Individual tool implementations

### Key Features

- **Automatic Categorization**: Tools are automatically categorized (search, utility, thinking, custom)
- **Model Support**: Tools can specify which providers/models they support
- **Hot Tools**: Tools can be temporarily activated for specific messages
- **Character Integration**: Characters can have predefined tool sets
- **Streaming Support**: Tools work seamlessly with the streaming chat system

## Adding a New Tool

### Step 1: Create the Tool Service

Create a new tool service in `src/tools/`:

```typescript
// src/tools/currencyConverter.tool.ts
import { ToolHandler } from './tool.interface';

export class CurrencyConverterToolService implements ToolHandler {
  getDescription(): string {
    return 'Convert between different currencies using real-time exchange rates';
  }

  getIcon(): string {
    return 'cash-outline';
  }

  getParamsSchema() {
    return {
      amount: { type: 'number', description: 'Amount to convert' },
      fromCurrency: { type: 'string', description: 'Source currency code' },
      toCurrency: { type: 'string', description: 'Target currency code' }
    };
  }

  getConfigSchema() {
    return {
      apiKey: { type: 'string', description: 'Exchange rate API key' }
    };
  }

  async execute(params: any, configValues: any) {
    const { amount, fromCurrency, toCurrency } = params;
    const { apiKey } = configValues;
    
    // Implement currency conversion logic here
    // This is just an example
    const result = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await result.json();
    const rate = data.rates[toCurrency];
    const convertedAmount = amount * rate;
    
    return {
      success: true,
      message: `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`,
      data: { convertedAmount, rate }
    };
  }
}
```

### Step 2: Add Tool Configuration

Add the tool to `src/tools/toolConfig.ts`:

```typescript
CurrencyConverter: {
  id: 'CurrencyConverter',
  category: 'utility',
  icon: 'cash-outline',
  description: 'Convert between different currencies'
},
```

### Step 3: Register the Tool

Add the tool to the registration in `src/hooks/useTools.ts`:

```typescript
const registerBuiltInTools = async () => {
  const handlers = {
    // ... existing tools
    CurrencyConverter: new CurrencyConverterToolService(),
  };
  
  // Register handlers in the registry
  for (const [type, handler] of Object.entries(handlers)) {
    await registerToolBlueprint({
      id: type,
      description: handler.getDescription(),
      icon: handler.getIcon(),
      code: '',
      paramsSchema: handler.getParamsSchema(),
      configSchema: handler.getConfigSchema(),
      execute: (params: any, configValues: any) => handler.execute(params, configValues)
    });
  }
};
```

### Step 4: Import the Tool

Add the import at the top of `useTools.ts`:

```typescript
import { CurrencyConverterToolService } from '../tools/currencyConverter.tool';
```

## Tool Categories

- **Search**: Tools that search for information (WebSearch, DocumentSearch)
- **Utility**: General utility tools (Calculator, Weather, Converters, Email, Note)
- **Thinking**: Special tools that enable thinking capabilities (Thinking)
- **Custom**: Custom or specialized tools (ImageGeneration)

## Tool Support Rules

Tools can specify which providers and models they support:

```typescript
Thinking: {
  id: 'Thinking',
  category: 'thinking',
  supportedProviders: ['Ollama'],
  supportedModels: ['qwen'],
  requiresModelCheck: true,
  icon: 'lightbulb',
  description: 'Enable thinking capabilities'
},
```

## Usage in Components

### Basic Usage

```typescript
import { ToolsMenu } from '@/src/components/chat/ToolsMenu';

// In your component
<ToolsMenu 
  onToolToggle={(toolId, enabled) => {
    console.log(`Tool ${toolId} ${enabled ? 'enabled' : 'disabled'}`);
  }}
/>
```

### Advanced Usage

```typescript
import { useTools } from '@/src/hooks/useTools';

const { getTools, executeTool, getActiveToolsForMessage } = useTools();

// Get all available tools
const tools = getTools();

// Execute a tool
const result = await executeTool('Calculator', { expression: '2 + 2' });

// Get active tools for a message
const activeTools = getActiveToolsForMessage(character, hotTools);
```

## Integration with Chat System

Tools are automatically integrated with the chat system:

1. **Character Tools**: Characters can have predefined tool sets via `toolIds`
2. **Hot Tools**: Users can temporarily activate tools via the ToolsMenu
3. **Streaming**: Tool calls are handled seamlessly in the streaming response
4. **State Management**: Tool state is managed via Jotai atoms

## Best Practices

1. **Keep Tools Focused**: Each tool should have a single, well-defined purpose
2. **Provide Good Descriptions**: Clear descriptions help users understand what tools do
3. **Handle Errors Gracefully**: Tools should return meaningful error messages
4. **Use Appropriate Icons**: Choose icons that clearly represent the tool's function
5. **Test Tool Support**: Ensure tools work with the intended providers/models

## Example: Adding a Translation Tool

Here's a complete example of adding a translation tool:

```typescript
// 1. Create the tool service
export class TranslationToolService implements ToolHandler {
  getDescription(): string {
    return 'Translate text between different languages';
  }

  getIcon(): string {
    return 'language-outline';
  }

  getParamsSchema() {
    return {
      text: { type: 'string', description: 'Text to translate' },
      targetLanguage: { type: 'string', description: 'Target language code' }
    };
  }

  getConfigSchema() {
    return {};
  }

  async execute(params: any, configValues: any) {
    // Implementation here
  }
}

// 2. Add to toolConfig.ts
Translation: {
  id: 'Translation',
  category: 'utility',
  supportedProviders: ['OpenAI', 'Anthropic'],
  icon: 'language-outline',
  description: 'Translate text between languages'
},

// 3. Register in useTools.ts
Translation: new TranslationToolService(),
```

That's it! The tool will automatically appear in the ToolsMenu and be available for use in chat conversations.
