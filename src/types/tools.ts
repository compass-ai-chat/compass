import { z } from 'zod';

export interface Tool {
    id: string;
    name: string;
    description: string;
    type: string;
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
    type: string;
    enabled?: boolean;
    configValues?: Record<string, any>;
  }
  
  export interface UpdateToolDto extends CreateToolDto {}