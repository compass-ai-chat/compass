import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { toolsAtom } from './atoms';
import { useEffect, useRef, useState } from 'react';
import { Character, ChatMessage, Thread, Document, Model, Provider } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { toastService } from '@/src/services/toastService';
import { Platform } from 'react-native';
import { Tool } from '../types/tools';
import { EmailToolService } from '../tools/email.tool';
import { ToolHandler } from '../tools/tool.interface';
import { ToolSet } from 'ai';


const toolHandlers: Record<string, ToolHandler> = {
    "email": new EmailToolService()
}

export function useTools() {
  const [tools, setTools] = useAtom(toolsAtom);

    const createTool = (tool: Tool) => {
        setTools([...tools, tool]);
    }

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

        const handler = toolHandlers[tool.type as keyof typeof toolHandlers];
        if (!handler) {
            throw new Error(`Tool handler for ${tool.type} not found`);
        }
        
        return handler.execute(params, tool.config);
    }

    const getToolSchemas = async (toolIds: string[]): Promise<ToolSet | undefined> => {
        if (!toolIds || toolIds.length === 0) return undefined;
        
        const tools = getTools();
        const enabledTools = tools.filter(tool => tool.enabled);
    
        let toolSet: ToolSet = {};
    
        enabledTools.forEach(tool => {
          const handler = toolHandlers[tool.type];
          const paramsSchema = handler.getParamsSchema();
          
          // For email tool, create a properly typed execute function
        if (tool.type === 'email') {
            toolSet[tool.id] = {
              description: tool.description,
              parameters: paramsSchema,
              execute: async ({ to, subject, body }: { to: string, subject: string, body: string }) => {
                return await executeTool(tool.id, { to, subject, body });
              }
            };
          } else {
            // For other tool types, use their specific parameter types
            toolSet[tool.id] = {
              description: tool.description,
              parameters: paramsSchema,
              execute: async (params: any) => {
                return await executeTool(tool.id, params);
              }
            };
          }
        });
        
        return toolSet;
      }
    

  return { createTool, updateTool, deleteTool, getTool, getTools, executeTool, getToolSchemas };
}

