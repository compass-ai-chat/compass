import { ToolHandler } from './tool.interface';

export type ToolDefinition = {
  name: string;
  description: string;
  icon: string;
  code: string;
};

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolHandler> = new Map();
  private definitions: Map<string, ToolDefinition> = new Map();

  private constructor() {}


} 