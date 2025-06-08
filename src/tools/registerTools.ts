import { ToolRegistry } from './registry';
import { EmailToolService } from './email.tool';
import { NoteToolService } from './note.tool';
import { WebSearchService } from './websearch.tool';
import { Tool } from '../types/tools';
import { useTools } from '../hooks/useTools';

export const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'email',
    name: 'Email',
    blueprintId: 'email',
    description: 'Send emails to recipients',
    blueprintId: 'email',
    enabled: true,
    icon: 'mail',
    configSchema: new EmailToolService().getConfigSchema(),
    paramsSchema: new EmailToolService().getParamsSchema(),
    configValues: {},
  },
  {
    id: 'note',
    name: 'Note',
    blueprintId: 'note',
    description: 'Create and manage notes',
    blueprintId: 'note',
    enabled: true,
    icon: 'pencil',
    configSchema: new NoteToolService().getConfigSchema(),
    paramsSchema: new NoteToolService().getParamsSchema(),
    configValues: {},
  },
  {
    id: 'websearch',
    name: 'Web Search',
    blueprintId: 'websearch',
    description: 'Search the web for information',
    blueprintId: 'websearch',
    enabled: true,
    icon: 'search',
    configSchema: new WebSearchService().getConfigSchema(),
    paramsSchema: new WebSearchService().getParamsSchema(),
    configValues: {},
  },
];

export async function registerBuiltInTools() {
  const {registerToolBlueprint, setToolExecutor} = useTools();
  const handlers = {
    email: new EmailToolService(),
    note: new NoteToolService(),
    websearch: new WebSearchService(),
  };

  // Register handlers in the registry
  for (const [type, handler] of Object.entries(handlers)) {
    // First register the tool structure
    await registerToolBlueprint({
      name: type,
      description: handler.getDescription(),
      icon: handler.getIcon(),
      code: '', // Built-in tools don't need code
      paramsSchema: handler.getParamsSchema(),
      configSchema: handler.getConfigSchema(),
    });

    // Then set the actual executor
    setToolExecutor(type, (params: any, configValues: any) => handler.execute(params, configValues));
  }

  return DEFAULT_TOOLS;
} 