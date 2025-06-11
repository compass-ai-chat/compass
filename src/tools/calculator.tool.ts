import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';

export class CalculatorToolService implements ToolHandler {
  async execute(params: { expression: string }): Promise<{ success: boolean, message: string, data: { result: number | string; expression: string } | null }> {
    try {
      // Sanitize the expression to only allow safe mathematical operations
      const sanitizedExpression = params.expression
        .replace(/[^0-9+\-*/().\s]/g, '')
        .trim();
      
      if (!sanitizedExpression) {
        throw new Error('Invalid mathematical expression');
      }

      // Use Function constructor for safe evaluation (better than eval)
      const result = Function(`"use strict"; return (${sanitizedExpression})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation result');
      }

      return {
        success: true,
        message: 'Calculation successful',
        data: {
          result,
          expression: sanitizedExpression,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Invalid expression'}`,
        data: null
      };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      expression: {
        type: 'string',
      },
    };
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'calculator';
  }

  getDescription(): string {
    return 'Perform mathematical calculations and evaluate expressions';
  }
} 