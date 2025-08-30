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
import { ImageGenerationService } from '../tools/image-generation.tool';
import { 
  isToolSupportedForModel, 
  getToolCategory as getToolCategoryFromConfig, 
  getToolIcon as getToolIconFromConfig, 
  getToolDescription as getToolDescriptionFromConfig 
} from '../tools/toolConfig';

export function useTools() {
  const [tools, setTools] = useAtom(userToolsAtom);
  const [toolBlueprints, setToolBlueprints] = useAtom(toolBlueprintsAtom);


  useEffect(() => {
    const toolsWithoutConfig = toolBlueprints.filter(x=> 
      !simpleSchemaHasConfigOptions(x.configSchema) && !tools.find(y=>y.name==x.id.toLowerCase()))
    setTools([...tools, ...toolsWithoutConfig.map((tool: ToolBlueprint) => {
      return {
        ...tool,
        name: tool.id,
        id: tool.id.toLowerCase(),
        blueprintId: tool.id.toLowerCase(),
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
      ImageGeneration: new ImageGenerationService(),
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
        id: type.toLowerCase(),
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
    if (!tool) return getToolIconFromConfig(toolId);
    return tool.icon || getToolIconFromConfig(toolId);
  }

  const isToolSupported = (toolId: string, model?: any) => {
    return isToolSupportedForModel(toolId, model);
  }

  const getActiveToolsForMessage = (character?: any, hotTools?: string[]) => {
    const activeTools: string[] = [];
    
    // Add character tools
    if (character?.toolIds) {
      activeTools.push(...character.toolIds);
    }
    
    // Add hot tools (temporarily activated)
    if (hotTools && hotTools.length > 0) {
      activeTools.push(...hotTools);
    }
    
    // Remove duplicates
    return [...new Set(activeTools)];
  }

  const validateToolAccess = (toolId: string, character?: any, hotTools?: string[]) => {
    const activeTools = getActiveToolsForMessage(character, hotTools);
    return activeTools.includes(toolId);
  }

  const getToolCategory = (toolId: string) => {
    return getToolCategoryFromConfig(toolId);
  }

  const getToolDescription = (toolId: string) => {
    return getToolDescriptionFromConfig(toolId);
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
    
    const filteredTools = tools.filter(tool => tool.enabled && toolIds.includes(tool.id.toLowerCase()));

    let toolSet: ToolSet = {};
    console.log("filteredTools", filteredTools, toolIds);

    for (const filteredTool of filteredTools) {
      try {
        const blueprint = toolBlueprints.find(t => t.id === filteredTool.blueprintId);

        if(!blueprint?.execute){
          console.error("Missing execute function for tool", filteredTool.name);
          continue;
        }

        toolSet[filteredTool.name.toLowerCase()] = tool({
          description: blueprint.description,
          inputSchema: simpleSchemaToZod(blueprint.paramsSchema),
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
    const action = pending ? "Using" : "Used";
    
    switch (toolId) {
      case "websearch":
        return pending 
          ? `Searching the web for "${args?.query || 'information'}..."` 
          : `Searched the web for "${args?.query || 'information'}"`;
      
      case "calculator":
        return pending 
          ? `Calculating "${args?.expression || 'expression'}..."` 
          : `Calculated "${args?.expression || 'expression'}"`;
      
      case "weather":
        return pending 
          ? `Getting weather for "${args?.location || 'location'}..."` 
          : `Got weather for "${args?.location || 'location'}"`;
      
      case "lengthconverter":
        return pending 
          ? `Converting length units..."` 
          : `Converted length units`;
      
      case "weightconverter":
        return pending 
          ? `Converting weight units..."` 
          : `Converted weight units`;
      
      case "email":
        return pending 
          ? `Composing email..."` 
          : `Composed email`;
      
      case "note":
        return pending 
          ? `Creating note..."` 
          : `Created note`;
      
      case "documentsearch":
        return pending 
          ? `Searching documents..."` 
          : `Searched documents`;
      
      case "imagegeneration":
        return pending 
          ? `Generating image..."` 
          : `Generated image`;
      
      case "thinking":
        return pending 
          ? `Thinking..."` 
          : `Finished thinking`;
      
      default:
        return pending ? `Using ${toolId}...` : `Used ${toolId}`;
    }
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
            id: "${blueprint.id.toLowerCase()}",
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
    getToolCallStatus,
    isToolSupported,
    getActiveToolsForMessage,
    validateToolAccess,
    getToolCategory,
    getToolDescription
  };
}


export function simpleSchemaHasConfigOptions(schema: SimpleSchema | undefined): boolean {
  if (!schema) return false;
  return Object.keys(schema).length > 0;
}
