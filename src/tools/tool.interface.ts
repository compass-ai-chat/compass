import { z } from 'zod';
export interface ToolHandler {
  execute: (params: any, config: any) => Promise<any>;
  getParamsSchema: () => z.ZodSchema;
  getConfigSchema: () => z.ZodSchema;
  getIcon: () => string;
  getDescription: () => string;
}