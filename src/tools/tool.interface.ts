import { z } from 'zod';
export interface ToolHandler {
  execute: (params: any, configValues: Record<string, any>) => Promise<any>;
  getParamsSchema: () => z.ZodSchema;
  getConfigSchema: () => z.ZodSchema;
  getIcon: () => string;
  getDescription: () => string;
}

export interface ToolBlueprint {
  // Static metadata
  name: string;
  description: string;
  icon: string;
  
  // Schema definitions
  paramsSchema: z.ZodSchema;
  configSchema: z.ZodSchema;
  
  // For dynamic tools
  code?: string;
  
  // The actual executor
  execute?: (params: any, configValues: Record<string, any>) => Promise<any>;
}

interface Tool {
  id: string;
  blueprintId: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  configValues?: Record<string, any>;
  isServerResource?: boolean;
}