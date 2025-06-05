import { getDefaultStore, useAtom } from 'jotai';
import { userToolsAtom } from './atoms';
import { Tool } from '../types/tools';
import { ToolRegistry } from '../tools/registry';
import { ToolSet } from 'ai';
import { zodSchemaToJsonSchema } from '../utils/zodHelpers';
import { registerBuiltInTools } from '../tools/registerTools';

export function useTools() {
  const [tools, setTools] = useAtom(userToolsAtom);
  const registry = ToolRegistry.getInstance();

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

  const createTool = async (tool: Tool) => {
    if (tool.type === 'dynamic') {
      await registry.registerTool({
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

    const handler = registry.getTool(tool.id);
    if (!handler) {
      throw new Error(`Tool handler for ${tool.id} not found`);
    }
    
    return handler.execute(params, tool.configValues || {});
  };

  const getToolSchemas = async (toolIds: string[]): Promise<ToolSet | undefined> => {
    if (!toolIds || toolIds.length === 0) return undefined;
    
    const tools = getTools();
    const enabledTools = tools.filter(tool => tool.enabled);

    let toolSet: ToolSet = {};

    enabledTools.forEach(tool => {
      const handler = registry.getTool(tool.id);
      if (!handler) return;

      const paramsSchema = handler.getParamsSchema();
      
      toolSet[tool.id] = {
        description: tool.description,
        parameters: zodSchemaToJsonSchema(paramsSchema),
        execute: async (params: any) => {
          return await executeTool(tool.id, params);
        }
      };
    });
    
    return toolSet;
  }

  const getToolTypes = () => {
    try {
      const toolTypes: Record<string, { paramsSchema: any; configSchema: any }> = {};
      const allTools = registry.getAllTools();

      for (const [type, handler] of allTools.entries()) {
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

  return { 
    createTool, 
    updateTool, 
    deleteTool, 
    getTool, 
    getTools, 
    executeTool, 
    getToolSchemas, 
    getToolTypes,
    initializeTools 
  };
}

