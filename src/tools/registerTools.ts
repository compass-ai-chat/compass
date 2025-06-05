import { ToolRegistry } from './registry';
import { EmailToolService } from './email.tool';
import { NoteToolService } from './note.tool';
import { WebSearchService } from './websearch.tool';
import { Tool } from '../types/tools';

const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Send emails to recipients',
    type: 'email',
    enabled: true,
    icon: 'mail',
    configSchema: new EmailToolService().getConfigSchema(),
    paramsSchema: new EmailToolService().getParamsSchema(),
    configValues: {},
  },
  {
    id: 'note',
    name: 'Note',
    description: 'Create and manage notes',
    type: 'note',
    enabled: true,
    icon: 'pencil',
    configSchema: new NoteToolService().getConfigSchema(),
    paramsSchema: new NoteToolService().getParamsSchema(),
    configValues: {},
  },
  {
    id: 'websearch',
    name: 'Web Search',
    description: 'Search the web for information',
    type: 'websearch',
    enabled: true,
    icon: 'search',
    configSchema: new WebSearchService().getConfigSchema(),
    paramsSchema: new WebSearchService().getParamsSchema(),
    configValues: {},
  },
];

export async function registerBuiltInTools() {
  const registry = ToolRegistry.getInstance();
  const handlers = {
    email: new EmailToolService(),
    note: new NoteToolService(),
    websearch: new WebSearchService(),
  };

  // Register handlers in the registry
  for (const [type, handler] of Object.entries(handlers)) {
    await registry.registerTool({
      name: type,
      description: handler.getDescription(),
      icon: handler.getIcon(),
      code: '', // Built-in tools don't need code
      paramsSchema: handler.getParamsSchema(),
      configSchema: handler.getConfigSchema(),
    });
  }

  return DEFAULT_TOOLS;
} 