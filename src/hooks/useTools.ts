import { getDefaultStore, useAtom } from 'jotai';
import { userToolsAtom } from './atoms';
import { Tool } from '../types/tools';
import { ToolSet } from 'ai';
import { DEFAULT_TOOLS } from '../tools/registerTools';
import { ToolBlueprint } from '../tools/tool.interface';
import { z } from 'zod';
import { EmailToolService } from '../tools/email.tool';
import { NoteToolService } from '../tools/note.tool';
import { WebSearchService } from '../tools/websearch.tool';
import { toolBlueprintsAtom } from './atoms';
import { zodSchemaToJsonSchema } from '../utils/zodHelpers';

export function useTools() {
  const [tools, setTools] = useAtom(userToolsAtom);
  const [toolBlueprints, setToolBlueprints] = useAtom(toolBlueprintsAtom);

  const initializeTools = async () => {
    try {
      const defaultTools = await registerBuiltInTools();
      // Only initialize if no tools exist
      if (tools.length === 0) {
        setTools(defaultTools.map((tool) => ({
          ...tool,
          configSchema: zodSchemaToJsonSchema(tool.configSchema as z.ZodSchema),
          paramsSchema: zodSchemaToJsonSchema(tool.paramsSchema as z.ZodSchema),
        })));
      }
    } catch (error) {
      console.error('Failed to initialize tools:', error);
    }
  };

  const registerBuiltInTools = async () => {
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
        execute: (params: any, configValues: any) => handler.execute(params, configValues)
      });
  
      // Then set the actual executor
      setToolExecutor(type, (params: any, configValues: any) => handler.execute(params, configValues));
    }
  
    return DEFAULT_TOOLS;
  } 

  const createToolBlueprint = async (tool: Tool) => {
    console.log("Creating tool", tool);
    if (tool.type === 'dynamic') {
      await registerToolBlueprint({
        name: tool.id,
        description: tool.description,
        icon: tool.icon || 'code',
        code: tool.code || '',
        paramsSchema: tool.paramsSchema || z.object({}),
        configSchema: tool.configSchema || z.object({}),
      });
    }
    setTools([...tools, tool]);
  };

  const updateTool = (tool: Tool) => {
    setTools(tools.map(t => t.id === tool.id ? tool : t));
  }

  const deleteTool = (tool: Tool) => {
    setTools(tools.filter(t => t.id !== tool.id));
  }

  const getTool = (id: string) => {
    return tools.find(t => t.id === id);
  }

  const getTools = () => {
    return tools;
  }
  

  const executeTool = async (toolId: string, params: Record<string, any>) => {
    const tool = getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found`);
    }

    const handler = toolBlueprints[tool.id];
    if (!handler) {
      throw new Error(`Tool handler for ${tool.id} not found`);
    }
    if(!handler.execute){
      throw new Error(`Tool handler for ${tool.id} does not have an execute function`);
    }
    let result = await handler.execute(params, tool.configValues || {});
    return result;
  };

  const getVercelCompatibleToolSet = async (toolIds: string[]): Promise<ToolSet | undefined> => {
    if (!toolIds || toolIds.length === 0) return undefined;
    
    const filteredTools = tools.filter(tool => tool.enabled && toolIds.includes(tool.id));

    let toolSet: ToolSet = {};

    for (const tool of filteredTools) {
      try {
        const blueprint = toolBlueprints[tool.blueprintId]

        if(!blueprint.execute){
          console.error("Missing execute function for tool", tool.name);
          continue;
        }

        toolSet[tool.name] = {
          description: blueprint.description,
          parameters: blueprint.paramsSchema,
          execute: async (params: any) => {
            console.log("Executing tool", tool.name, params);
            return await blueprint.execute?.(params, tool.configValues || {});
          }
        };
      } catch (error) {
        console.error(`Error processing tool ${tool.id}:`, error);
        // Skip this tool if there's an error
        continue;
      }
    }
    console.log('toolSet', toolSet);
    
    
    return toolSet;
  }

  const getToolBlueprints = () : ToolBlueprint[] => {
    try {
      return Object.values(toolBlueprints);
    } catch (error) {
      console.error('Error in getToolBlueprints:', error);
      return [];
    }
  }

  const registerToolBlueprint = (blueprint: ToolBlueprint) => {
    try {

      if (!blueprint.code) {
        // Built-in tool registration
        setToolBlueprints(prev => ({
          ...prev,
          [blueprint.name]: blueprint
        }));
      } else {
        // Dynamic tool registration
        const context = { z, console, fetch: globalThis.fetch };
        
        const wrappedCode = `
          return {
            name: "${blueprint.name}",
            description: "${blueprint.description}",
            icon: "${blueprint.icon}",
            paramsSchema: ${serializeSchema(blueprint.paramsSchema)},
            configSchema: ${serializeSchema(blueprint.configSchema)},
            async execute(params, configValues) {
              try {
                ${blueprint.code}
              } catch (error) {
                console.error('Tool execution error:', error);
                throw error;
              }
            }
          };
        `;
  
        const toolImpl = new Function(...Object.keys(context), wrappedCode)
          (...Object.values(context));
  
        setToolBlueprints(prev => ({
          ...prev,
          [blueprint.name]: toolImpl
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Failed to register tool ${blueprint.name}: ${error}`);
    }
  }

  const setToolExecutor = (name: string, executor: (params: any, configValues: any) => Promise<any>) => {
    const tool = toolBlueprints[name];
    if (tool) {
      tool.execute = executor;
    }
  }

  return { 
    createToolBlueprint, 
    updateTool, 
    deleteTool, 
    getTool, 
    getTools, 
    getVercelCompatibleToolSet, 
    getToolBlueprints,
    initializeTools,
    registerToolBlueprint,
    setToolExecutor,
    executeTool
  };
}



function serializeSchema(schema: z.ZodSchema | undefined): string {
  if (!schema) return 'z.object({})';
  
  // Handle built-in Zod schemas
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    const entries = Object.entries(shape).map(([key, value]) => {
      return `${key}: ${serializeSchema(value as z.ZodSchema)}`;
    });
    return `z.object({${entries.join(',')}})`;
  }
  if (schema instanceof z.ZodString) return 'z.string()';
  if (schema instanceof z.ZodNumber) return 'z.number()';
  if (schema instanceof z.ZodBoolean) return 'z.boolean()';
  if (schema instanceof z.ZodArray) {
    return `z.array(${serializeSchema(schema._def.type)})`;
  }
  if (schema instanceof z.ZodOptional) {
    return `${serializeSchema(schema._def.innerType)}.optional()`;
  }
  
  // Fallback
  return 'z.any()';
}