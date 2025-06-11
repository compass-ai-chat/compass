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
import { SimpleSchema, simpleSchemaToZod, zodSchemaToJsonSchema } from '../utils/zodHelpers';
import { useEffect, useRef } from 'react';

export function useTools() {
  const [tools, setTools] = useAtom(userToolsAtom);
  const [toolBlueprints, setToolBlueprints] = useAtom(toolBlueprintsAtom);


  useEffect(() => {
    const toolsWithoutConfig = toolBlueprints.filter(x=> 
      !simpleSchemaHasConfigOptions(x.configSchema) && !tools.find(y=>y.name==x.id))
    setTools([...tools, ...toolsWithoutConfig.map((tool: ToolBlueprint) => {
      return {
        ...tool,
        name: tool.id,
        id: tool.id,
        blueprintId: tool.id,
        enabled: true,
        configValues: {},
      }
    })]);
  }, [toolBlueprints]);

  const initializeTools = async () => {
    await registerBuiltInTools();
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
        id: type,
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

  const createToolBlueprint = async (tool: ToolBlueprint) => {
    console.log("Creating tool", tool);
    if (tool.id === 'dynamic') {
      await registerToolBlueprint({
        id: tool.id,
        description: tool.description,
        icon: tool.icon || 'code',
        code: tool.code || '',
        paramsSchema: tool.paramsSchema || {},
        configSchema: tool.configSchema || {},
      });
    }
  };

  const updateTool = (tool: Tool) => {
    setTools(tools.map(t => t.id === tool.id ? tool : t));
  }

  const addTool = (tool: Tool) => {
    setTools([...tools, tool]);
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
    console.log("Finding tool", toolId);
    console.log("tools", tools);
    const tool = getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found`);
    }

    console.log("tool found", tool);

    const handler = toolBlueprints.find(t => t.id === tool.blueprintId);
    console.log("handler", handler);
    console.log("handler paramsSchema", handler?.paramsSchema);
    if (!handler) {
      throw new Error(`Tool handler for ${tool.id} not found`);
    }
    if(!handler.execute){
      throw new Error(`Tool handler for ${tool.id} does not have an execute function`);
    }
    
    console.log("executing tool", handler.execute, typeof handler.execute);
    let result = await handler.execute(params, tool.configValues || {});
    console.log("result", result);
    return result;
  };

  const getVercelCompatibleToolSet = async (toolIds: string[]): Promise<ToolSet | undefined> => {
    if (!toolIds || toolIds.length === 0) return undefined;
    
    const filteredTools = tools.filter(tool => tool.enabled && toolIds.includes(tool.id));

    let toolSet: ToolSet = {};

    for (const tool of filteredTools) {
      try {
        const blueprint = toolBlueprints.find(t => t.id === tool.blueprintId);

        if(!blueprint?.execute){
          console.error("Missing execute function for tool", tool.name);
          continue;
        }

        toolSet[tool.name] = {
          description: blueprint.description,
          parameters: simpleSchemaToZod(blueprint.paramsSchema),
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
      return toolBlueprints;
  }

  const registerToolBlueprint = (blueprint: ToolBlueprint) : ToolBlueprint => {
    try {

      if (!blueprint.code) {
        // Built-in tool registration
        setToolBlueprints(prev => [...prev, blueprint]);
        return blueprint;
      } else {
        // Dynamic tool registration
        const context = { z, console, fetch: globalThis.fetch };
        
        const wrappedCode = `
          return {
            id: "${blueprint.id}",
            description: "${blueprint.description}",
            icon: "${blueprint.icon}",
            paramsSchema: ${JSON.stringify(blueprint.paramsSchema)},
            configSchema: ${JSON.stringify(blueprint.configSchema)},
            async execute(params, configValues) {
              try {
                ${blueprint.code+"\nreturn execute(params, configValues);"}
              } catch (error) {
                console.error('Tool execution error:', error);
                throw error;
              }
            }
          };
        `;
  
        const toolImpl = new Function(...Object.keys(context), wrappedCode)
          (...Object.values(context));
  
        setToolBlueprints(prev => [...prev, toolImpl]);
        return toolImpl;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Failed to register tool ${blueprint.id}: ${error}`);
    }
  }

  const setToolExecutor = (name: string, executor: (params: any, configValues: any) => Promise<any>) => {
    const tool = toolBlueprints.find(t => t.id === name);
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
    executeTool,
    addTool
  };
}

export function zodHasConfigOptions(schema: z.ZodSchema): boolean {
  if (!schema) return false;

  // Check if the config schema is an empty object
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema._def.shape()).length > 0;
  }
  return false;
}

export function simpleSchemaHasConfigOptions(schema: SimpleSchema | undefined): boolean {
  if (!schema) return false;
  return Object.keys(schema).length > 0;
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