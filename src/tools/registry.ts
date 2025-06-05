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

  async registerTool(definition: ToolDefinition): Promise<void> {
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
        this.tools.set(definition.name, tool);
        this.definitions.set(definition.name, definition);
        return;
      }

      // For dynamic tools, create a class with the provided code
      const wrappedCode = `
        return class DynamicTool {
          async execute(params, configValues) {
            ${definition.code}
          }

          getParamsSchema() {
            return ${this.serializeSchema(definition.paramsSchema)};
          }

          getConfigSchema() {
            return ${this.serializeSchema(definition.configSchema)};
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

  // Method to replace a tool's execute function (used for built-in tools)
  setToolExecutor(name: string, executor: (params: any, configValues: any) => Promise<any>): void {
    const tool = this.tools.get(name);
    if (tool) {
      tool.execute = executor;
    }
  }
} 