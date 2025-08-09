import { getDefaultStore, useAtom } from 'jotai';
import { userToolsAtom } from './atoms';
import { Tool } from '../types/tools';
import { ToolSet } from 'ai';
import { ToolBlueprint } from '../tools/tool.interface';
import { z } from 'zod';
import { EmailToolService } from '../tools/email.tool';
import { NoteToolService } from '../tools/note.tool';
import { WebSearchService } from '../tools/websearch.tool';
import { toolBlueprintsAtom } from './atoms';
import { SimpleSchema, simpleSchemaToZod, zodSchemaToJsonSchema } from '../utils/zodHelpers';
import { useEffect, useRef } from 'react';
import { CalculatorToolService } from '../tools/calculator.tool';
import { WeatherToolService } from '../tools/weather.tool';
import { LengthConverterToolService } from '../tools/lengthconverter.tool';
import { WeightConverterToolService } from '../tools/weightconverter.tool';
import { DocumentSearchTool } from '../tools/documentSearch.tool';
import { tool } from 'ai';
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
      Email: new EmailToolService(),
      Note: new NoteToolService(),
      WebSearch: new WebSearchService(),
      Calculator: new CalculatorToolService(),
      Weather: new WeatherToolService(),
      LengthConverter: new LengthConverterToolService(),
      WeightConverter: new WeightConverterToolService(),
      DocumentSearch: new DocumentSearchTool()
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
  
  } 

  const getIcon = (toolId: string) => {
    const tool = toolBlueprints.find(t => t.id === toolId);
    if (!tool) return 'code';
    return tool.icon;
  }

  const createToolBlueprint = async (tool: ToolBlueprint) => {
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
    const tool = getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found`);
    }

    const handler = toolBlueprints.find(t => t.id === tool.blueprintId);
    if (!handler) {
      throw new Error(`Tool handler for ${tool.id} not found`);
    }
    if(!handler.execute){
      throw new Error(`Tool handler for ${tool.id} does not have an execute function`);
    }
    
    console.log("executing tool", handler.execute, typeof handler.execute);
    let result = await handler.execute(params, tool.configValues || {});
    return result;
  };

  const getVercelCompatibleToolSet = async (toolIds: string[]): Promise<ToolSet | undefined> => {
    if (!toolIds || toolIds.length === 0) return undefined;
    
    const filteredTools = tools.filter(tool => tool.enabled && toolIds.includes(tool.id));

    let toolSet: ToolSet = {};

    for (const filteredTool of filteredTools) {
      try {
        const blueprint = toolBlueprints.find(t => t.id === filteredTool.blueprintId);

        if(!blueprint?.execute){
          console.error("Missing execute function for tool", filteredTool.name);
          continue;
        }

        toolSet["websearch"] = tool({
          description: blueprint.description,
          inputSchema: z.object({
            query: z.string().describe('The query to search the web for'),
          }),
          execute: async (params: any) => {
            console.log("Executing tool", filteredTool.name, params);
            return await blueprint.execute?.(params, filteredTool.configValues || {});
          }
        });
      } catch (error) {
        console.error(`Error processing tool ${filteredTool.id}:`, error);
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

  const getToolCallStatus = (toolId: string, args: any, pending: boolean) => {
    
    if(toolId == "WebSearch"){
      return pending ? `Searching the web for ${args.query}...` : `Searched the web for ${args.query}`;
    }
    return pending ? `Using ${toolId}...` : `Used ${toolId}`;
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
    addTool,
    getIcon,
    getToolCallStatus
  };
}


export function simpleSchemaHasConfigOptions(schema: SimpleSchema | undefined): boolean {
  if (!schema) return false;
  return Object.keys(schema).length > 0;
}
