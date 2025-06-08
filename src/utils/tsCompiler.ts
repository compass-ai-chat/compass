import { SimpleSchema, SimpleSchemaProperty } from './zodHelpers';

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

function typeToSimpleSchema(type: Record<string, string>): SimpleSchema {
  const schema: SimpleSchema = {};
  
  for (const [key, value] of Object.entries(type)) {
    let schemaProperty: SimpleSchemaProperty;
    
    if (value.endsWith('[]')) {
      schemaProperty = { type: 'array' };
    } else {
      schemaProperty = { type: value };
    }
    
    schema[key] = schemaProperty;
  }

  return schema;
}

export function compileTypescript(code: string): { 
  compiledCode: string;
  paramsSchema: SimpleSchema;
  configSchema: SimpleSchema;
} {
  // Extract type information
  const { paramsType, configType } = extractTypeInfo(code);

  // Generate SimpleSchema schemas
  const paramsSchema = Object.keys(paramsType).length > 0 
    ? typeToSimpleSchema(paramsType)
    : {};
  
  const configSchema = Object.keys(configType).length > 0
    ? typeToSimpleSchema(configType)
    : {};

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