import { z } from 'zod';
import { SimpleSchema } from '../utils/zodHelpers';

export interface Tool {
    id: string;
    name: string;
    blueprintId: string;
    description: string;
    enabled: boolean;
    isServerResource?: boolean;
    icon?: string;
    code?: string;
    configValues?: Record<string, any>;
  }
  
  export interface CreateToolDto {
    name: string;
    description: string;
    blueprintId: string;
    enabled?: boolean;
    code?: string;
    configValues?: Record<string, any>;
  }
  
  export interface UpdateToolDto extends CreateToolDto {}

  export interface CreateBlueprintDto {
    name: string;
    description: string;
    icon?: string;
    code?: string;
    paramsSchema: SimpleSchema;
    configSchema: SimpleSchema;
  }

  export interface UpdateBlueprintDto extends CreateBlueprintDto {}