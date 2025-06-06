import { getDefaultStore, useAtom } from 'jotai';
import { userToolsAtom } from './atoms';
import { Tool } from '../types/tools';
import { ToolDefinition, ToolRegistry } from '../tools/registry';
import { ToolSet } from 'ai';
import { zodSchemaToJsonSchema } from '../utils/zodHelpers';
import { DEFAULT_TOOLS } from '../tools/registerTools';
import { ToolHandler } from '../tools/tool.interface';
import { z } from 'zod';
import { EmailToolService } from '../tools/email.tool';
import { NoteToolService } from '../tools/note.tool';
import { WebSearchService } from '../tools/websearch.tool';
import { toolBlueprintsAtom, blueprintDefinitionsAtom } from './atoms';

export function useTools() {
  const [tools, setTools] = useAtom(userToolsAtom);
  const [toolBlueprints, setToolBlueprints] = useAtom(toolBlueprintsAtom);
  const [blueprintDefinitions, setBlueprintDefinitions] = useAtom(blueprintDefinitionsAtom);

  const initializeTools = async () => {
    try {
      const defaultTools = await registerBuiltInTools();
      // Only initialize if no tools exist
      if (tools.length === 0) {
        setTools(defaultTools);
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
      });
  
      // Then set the actual executor
      setToolExecutor(type, (params: any, configValues: any) => handler.execute(params, configValues));
    }
  
    return DEFAULT_TOOLS;
  } 

  const createTool = async (tool: Tool) => {
    console.log("Creating tool", tool);
    if (tool.type === 'dynamic') {
      await registerToolBlueprint({
        name: tool.id,
        description: tool.description,
        icon: tool.icon || 'code',
        code: tool.code || '',
        paramsSchema: tool.paramsSchema,
        configSchema: tool.configSchema,
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
    let result = await handler.execute(params, tool.configValues || {});
    return result;
  };

  const getToolSchemas = async (toolIds: string[]): Promise<ToolSet | undefined> => {
    if (!toolIds || toolIds.length === 0) return undefined;
    
    const tools = getTools();
    const enabledTools = tools.filter(tool => tool.enabled && toolIds.includes(tool.id));

    let toolSet: ToolSet = {};

    for (const tool of enabledTools) {
      try {
        const handler = toolBlueprints[tool.id];
        if (!handler) {
          console.error(`Tool handler for ${tool.name} not found`);
          continue;
        }

        const paramsSchema = handler.getParamsSchema();
        const jsonSchema = zodSchemaToJsonSchema(paramsSchema);
        
        toolSet[tool.name] = {
          description: tool.description,
          parameters: paramsSchema,
          execute: async (params: any) => {
            console.log("Executing tool", tool.name, params);
            return await executeTool(tool.name, params);
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

  const getToolBlueprints = () => {
    try {
      const toolTypes: Record<string, { paramsSchema: any; configSchema: any }> = {};
      console.log("toolBlueprints", toolBlueprints);

      for (const [type, handler] of Object.entries(toolBlueprints)) {
        try {
          const paramsSchema = handler.getParamsSchema();
          const configSchema = handler.getConfigSchema();
          
          toolTypes[type] = {
            paramsSchema: zodSchemaToJsonSchema(paramsSchema),
            configSchema: zodSchemaToJsonSchema(configSchema)
          };
        } catch (error) {
          console.error(`Error processing schema for tool ${type}:`, error);
          // Provide a fallback schema for this tool
          toolTypes[type] = {
            paramsSchema: {},
            configSchema: {}
          };
        }
      }
      return toolTypes;
    } catch (error) {
      console.error('Error in getToolTypes:', error);
      return {};
    }
  }

  const registerToolBlueprint = (definition: ToolDefinition) => {
    try {

      // Create a safe execution context
      const context = {
        z,
        console,
        fetch: globalThis.fetch,
      };

      // For built-in tools (no code), create a simple pass-through handler
      if (!definition.code) {
        const tool: ToolHandler = {
          async execute(params: any, configValues: any) {
            // This will be replaced by the actual handler
            return undefined;
          },
          getParamsSchema() {
            return definition.paramsSchema || z.object({});
          },
          getConfigSchema() {
            return definition.configSchema || z.object({});
          },
          getIcon() {
            return definition.icon;
          },
          getDescription() {
            return definition.description;
          }
        };
        setToolBlueprints(prevBlueprints => ({
          ...prevBlueprints,
          [definition.name]: tool
        }));
        setBlueprintDefinitions(prevDefinitions => ({
          ...prevDefinitions,
          [definition.name]: definition
        }));
        console.log("Registered tool blueprint", definition.name);
        console.log("toolBlueprints", toolBlueprints);
        console.log("blueprintDefinitions", blueprintDefinitions);
        return;
      }

      // For dynamic tools, create a class with the provided code
      const wrappedCode = `
        return class DynamicTool {
          async execute(params, configValues) {
            try {
              ${definition.code}
            } catch (error) {
              console.error('Tool execution error:', error);
              throw error;
            }
          }

          getParamsSchema() {
            return ${serializeSchema(definition.paramsSchema)};
          }

          getConfigSchema() {
            return ${serializeSchema(definition.configSchema)};
          }

          getIcon() {
            return "${definition.icon}";
          }

          getDescription() {
            return "${definition.description}";
          }
        }
      `;

      // Create the tool class
      const ToolClass = new Function(...Object.keys(context), wrappedCode)
        (...Object.values(context));

      // Instantiate and register the tool
      const tool = new ToolClass();

      
      // Validate that the schemas work
      try {
        tool.getParamsSchema();
        tool.getConfigSchema();
      } catch (error) {
        throw new Error(`Invalid schema definition for tool ${definition.name}: ${error}`);
      }

      setToolBlueprints(prevBlueprints => ({
        ...prevBlueprints,
        [definition.name]: tool
      }));
      setBlueprintDefinitions(prevDefinitions => ({
        ...prevDefinitions,
        [definition.name]: definition
      }));
      console.log("Registered tool blueprint", definition.name);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Failed to register tool ${definition.name}: ${error}`);
    }
  }

  const setToolExecutor = (name: string, executor: (params: any, configValues: any) => Promise<any>) => {
    const tool = toolBlueprints[name];
    if (tool) {
      tool.execute = executor;
    }
  }

  return { 
    createTool, 
    updateTool, 
    deleteTool, 
    getTool, 
    getTools, 
    executeTool, 
    getToolSchemas, 
    getToolBlueprints,
    initializeTools,
    registerToolBlueprint,
    setToolExecutor
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