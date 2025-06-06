import { z } from 'zod';
import { ToolHandler } from './tool.interface';

export type ToolDefinition = {
  name: string;
  description: string;
  icon: string;
  code: string;
  paramsSchema: z.ZodSchema | undefined;
  configSchema: z.ZodSchema | undefined;
};

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolHandler> = new Map();
  private definitions: Map<string, ToolDefinition> = new Map();

  private constructor() {}

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private serializeSchema(schema: z.ZodSchema | undefined): string {
    if (!schema) return 'z.object({})';
    
    // Handle built-in Zod schemas
    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape();
      const entries = Object.entries(shape).map(([key, value]) => {
        return `${key}: ${this.serializeSchema(value as z.ZodSchema)}`;
      });
      return `z.object({${entries.join(',')}})`;
    }
    if (schema instanceof z.ZodString) return 'z.string()';
    if (schema instanceof z.ZodNumber) return 'z.number()';
    if (schema instanceof z.ZodBoolean) return 'z.boolean()';
    if (schema instanceof z.ZodArray) {
      return `z.array(${this.serializeSchema(schema._def.type)})`;
    }
    if (schema instanceof z.ZodOptional) {
      return `${this.serializeSchema(schema._def.innerType)}.optional()`;
    }
    
    // Fallback
    return 'z.any()';
  }

  getAllTools(): Map<string, ToolHandler> {
    return this.tools;
  }

} 