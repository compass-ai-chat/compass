
import { SimpleSchema } from '../utils/zodHelpers';
export interface ToolHandler {
  execute: (params: any, configValues: any) => Promise<{success: boolean, message: string, data: any | null}>;
  getParamsSchema: () => SimpleSchema;
  getConfigSchema: () => SimpleSchema;
  getIcon: () => string;
  getDescription: () => string;
}

export interface ToolBlueprint {
  // Static metadata
  id: string;
  description: string;
  icon: string;
  
  // Schema definitions
  paramsSchema: SimpleSchema;
  configSchema: SimpleSchema;
  
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