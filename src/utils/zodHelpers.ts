import { z } from 'zod';

// Helper method to convert Zod schema to a more readable format
export function zodSchemaToJsonSchema(schema: z.ZodSchema) {
  try {
    // Try to extract the shape from the schema
    if ('_def' in schema && schema._def && 'typeName' in schema._def) {
      if (schema._def.typeName === 'ZodObject' && 'shape' in schema._def && typeof schema._def.shape === 'function') {
        const shape = schema._def.shape();
        const result = {} as any;
        
        for (const [key, fieldSchema] of Object.entries(shape)) {
          result[key] = getZodFieldInfo(fieldSchema);
        }
        
        return result;
      }
    }
    
    // For non-object schemas, return a simplified type info
    return getZodFieldInfo(schema);
  } catch (error) {
    console.error('Error converting Zod schema:', error);
    return { type: 'unknown' };
  }
}


export function getZodFieldInfo(fieldSchema: any): any {
    if (!fieldSchema || !fieldSchema._def || !('typeName' in fieldSchema._def)) {
      return { type: 'unknown' };
    }
    
    const typeName = fieldSchema._def.typeName;
    
    switch (typeName) {
      case 'ZodString':
        return { 
          type: 'string',
          ...(fieldSchema._def.minLength !== undefined ? { minLength: fieldSchema._def.minLength } : {}),
          ...(fieldSchema._def.maxLength !== undefined ? { maxLength: fieldSchema._def.maxLength } : {})
        };
      case 'ZodNumber':
        return { 
          type: 'number',
          ...(fieldSchema._def.minimum !== undefined ? { minimum: fieldSchema._def.minimum } : {}),
          ...(fieldSchema._def.maximum !== undefined ? { maximum: fieldSchema._def.maximum } : {})
        };
      case 'ZodBoolean':
        return { type: 'boolean' };
      case 'ZodArray':
        return { 
          type: 'array',
          items: getZodFieldInfo(fieldSchema._def.type)
        };
      case 'ZodEnum':
        return { 
          type: 'enum',
          values: fieldSchema._def.values
        };
      case 'ZodObject':
        if ('shape' in fieldSchema._def && typeof fieldSchema._def.shape === 'function') {
          const shape = fieldSchema._def.shape();
          const result = {} as any;
          
          for (const [key, subFieldSchema] of Object.entries(shape)) {
            result[key] = getZodFieldInfo(subFieldSchema);
          }
          
          return { 
            type: 'object',
            properties: result
          };
        }
        return { type: 'object' };
      case 'ZodOptional':
        return {
          ...getZodFieldInfo(fieldSchema._def.innerType),
          optional: true
        };
      default:
        return { type: typeName.replace('Zod', '').toLowerCase() };
    }
  }


export interface SimpleSchemaProperty {
  type: string;
}

export interface SimpleSchema {
  [key: string]: SimpleSchemaProperty;
}

/**
 * Converts a SimpleSchema to a Zod schema
 * @param schema The simple schema to convert
 * @returns A Zod schema object
 */
export function simpleSchemaToZod(schema: SimpleSchema): z.ZodObject<any> {
  const zodShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, property] of Object.entries(schema)) {
    switch (property.type.toLowerCase()) {
      case 'string':
        zodShape[key] = z.string();
        break;
      case 'number':
        zodShape[key] = z.number();
        break;
      case 'boolean':
        zodShape[key] = z.boolean();
        break;
      case 'array':
        zodShape[key] = z.array(z.any());
        break;
      case 'object':
        zodShape[key] = z.object({});
        break;
      default:
        zodShape[key] = z.any();
    }
  }

  return z.object(zodShape);
} 