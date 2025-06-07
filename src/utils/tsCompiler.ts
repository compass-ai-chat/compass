import { z } from 'zod';

interface ExtractedTypes {
  paramsType: Record<string, string>;
  configType: Record<string, string>;
}

function extractTypeInfo(code: string): ExtractedTypes {
  // Extract type annotations using regex
  const paramsTypeMatch = code.match(/params\s*:\s*({[^}]+})/);
  const configTypeMatch = code.match(/configValues\s*:\s*({[^}]+})/);

  const paramsType: Record<string, string> = {};
  const configType: Record<string, string> = {};

  if (paramsTypeMatch) {
    const typeStr = paramsTypeMatch[1];
    const propertyMatches = Array.from(typeStr.matchAll(/(\w+)\s*:\s*(string|number|boolean|any)(\[\])?/g));
    for (const [, name, type, isArray] of propertyMatches) {
      paramsType[name] = isArray ? `${type}[]` : type;
    }
  }

  if (configTypeMatch) {
    const typeStr = configTypeMatch[1];
    const propertyMatches = Array.from(typeStr.matchAll(/(\w+)\s*:\s*(string|number|boolean|any)(\[\])?/g));
    for (const [, name, type, isArray] of propertyMatches) {
      configType[name] = isArray ? `${type}[]` : type;
    }
  }

  return { paramsType, configType };
}

function typeToZodSchema(type: Record<string, string>): string {
  const entries = Object.entries(type).map(([key, value]) => {
    let schema: string;
    if (value.endsWith('[]')) {
      const baseType = value.slice(0, -2);
      schema = `z.array(z.${baseType}())`;
    } else {
      schema = `z.${value}()`;
    }
    return `${key}: ${schema}`;
  });

  return `z.object({ ${entries.join(', ')} })`;
}

export function compileTypescript(code: string): { 
  compiledCode: string;
  paramsSchema: string;
  configSchema: string;
} {
  // Extract type information
  const { paramsType, configType } = extractTypeInfo(code);

  // Generate Zod schemas
  const paramsSchema = Object.keys(paramsType).length > 0 
    ? typeToZodSchema(paramsType)
    : 'z.object({})';
  
  const configSchema = Object.keys(configType).length > 0
    ? typeToZodSchema(configType)
    : 'z.object({})';

  // Strip out TypeScript types
  const compiledCode = code
    .replace(/:\s*{[^}]+}/g, '') // Remove type annotations
    .replace(/:\s*(string|number|boolean|any)(\[\])?/g, ''); // Remove primitive type annotations

  return {
    compiledCode,
    paramsSchema,
    configSchema
  };
} 