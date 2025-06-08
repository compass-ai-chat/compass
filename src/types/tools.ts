import { z } from 'zod';

export interface Tool {
    id: string;
    name: string;
    blueprintId: string;
    description: string;
    enabled: boolean;
    isServerResource?: boolean;
    icon?: string;
    code?: string;
    paramsSchema?: z.ZodSchema;
    configSchema?: z.ZodSchema;
    configValues?: Record<string, any>;
  }
  
  export interface CreateToolDto {
    name: string;
    description: string;
    blueprintId: string;
    enabled?: boolean;
    icon?: string;
    code?: string;
    configValues?: Record<string, any>;
    paramsSchema?: z.ZodSchema;
    configSchema?: z.ZodSchema;
  }
  
  export interface UpdateToolDto extends CreateToolDto {}

  export interface CreateBlueprintDto {
    name: string;
    description: string;
    icon?: string;
    code?: string;
    paramsSchema: z.ZodSchema;
    configSchema: z.ZodSchema;
  }

  export interface UpdateBlueprintDto extends CreateBlueprintDto {}