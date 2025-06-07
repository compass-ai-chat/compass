import { z } from 'zod';

interface TypeInfo {
  type: string;
  properties?: Record<string, TypeInfo>;
  optional?: boolean;
}

function parseTypeToZodSchema(typeInfo: TypeInfo): string {
  if (typeInfo.properties) {
    const props = Object.entries(typeInfo.properties)
      .map(([key, value]) => `${key}: ${parseTypeToZodSchema(value)}`)
      .join(', ');
    return `z.object({ ${props} })${typeInfo.optional ? '.optional()' : ''}`;
  }

  let schema = '';
  switch (typeInfo.type) {
    case 'string':
      schema = 'z.string()';
      break;
    case 'number':
      schema = 'z.number()';
      break;
    case 'boolean':
      schema = 'z.boolean()';
      break;
    case 'any':
      schema = 'z.any()';
      break;
    default:
      schema = 'z.any()';
  }

  return typeInfo.optional ? `${schema}.optional()` : schema;
}

function extractTypeInfo(code: string, paramName: string): TypeInfo | null {
  try {
    // Find the execute function parameters
    const functionMatch = code.match(/async\s+function\s+execute\s*\(([^)]+)\)/);
    if (!functionMatch) return null;

    const params = functionMatch[1].split(',').map(p => p.trim());
    const paramIndex = paramName === 'params' ? 0 : 1;
    
    if (!params[paramIndex]) return null;

    // Look for type annotations in comments above the function
    const typeCommentMatch = code.match(new RegExp(`${params[paramIndex]}\\s*:\\s*({[^}]+})`));
    if (!typeCommentMatch) return null;

    const typeDefinition = typeCommentMatch[1];
    const properties: Record<string, TypeInfo> = {};

    // Extract properties from the type definition
    const propertyMatches = typeDefinition.matchAll(/(\w+)(\?)?:\s*(string|number|boolean|any)/g);
    for (const match of propertyMatches) {
      const [, name, optional, type] = match;
      properties[name] = {
        type,
        optional: !!optional
      };
    }

    return {
      type: 'object',
      properties
    };
  } catch (error) {
    console.error('Error extracting type info:', error);
    return null;
  }
}

export function extractSchemas(code: string): { paramsSchema: string; configSchema: string } {
  const paramsTypeInfo = extractTypeInfo(code, 'params');
  const configTypeInfo = extractTypeInfo(code, 'configValues');

  return {
    paramsSchema: paramsTypeInfo ? parseTypeToZodSchema(paramsTypeInfo) : 'z.object({})',
    configSchema: configTypeInfo ? parseTypeToZodSchema(configTypeInfo) : 'z.object({})'
  };
} 