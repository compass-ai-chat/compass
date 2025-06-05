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

  async registerTool(definition: ToolDefinition): Promise<void> {
    try {
      // Create a safe execution context
      const context = {
        z,
        console,
        fetch: globalThis.fetch,
      };

      // Create a function that returns the schemas
      const paramsSchemaFunc = definition.paramsSchema ? 
        `return ${definition.paramsSchema.toString()};` :
        'return z.object({});';
      
      const configSchemaFunc = definition.configSchema ? 
        `return ${definition.configSchema.toString()};` :
        'return z.object({});';

      // Wrap the code in a class that implements ToolHandler
      const wrappedCode = `
        return class DynamicTool {
          async execute(params, config) {
            ${definition.code}
          }

          getParamsSchema() {
            const schemaFunc = new Function('z', '${paramsSchemaFunc}');
            return schemaFunc(z);
          }

          getConfigSchema() {
            const schemaFunc = new Function('z', '${configSchemaFunc}');
            return schemaFunc(z);
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
      this.tools.set(definition.name, tool);
      this.definitions.set(definition.name, definition);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(`Failed to register tool ${definition.name}: ${error}`);
    }
  }

  getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  getDefinition(name: string): ToolDefinition | undefined {
    return this.definitions.get(name);
  }

  getAllTools(): Map<string, ToolHandler> {
    return this.tools;
  }

  getAllDefinitions(): Map<string, ToolDefinition> {
    return this.definitions;
  }
} 