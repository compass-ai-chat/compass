import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';

export class LengthConverterToolService implements ToolHandler {
  private readonly conversions: Record<string, Record<string, number | string>> = {
    length: {
      meter: 1,
      kilometer: 0.001,
      centimeter: 100,
      millimeter: 1000,
      inch: 39.3701,
      foot: 3.28084,
      yard: 1.09361,
      mile: 0.000621371,
    },
    weight: {
      kilogram: 1,
      gram: 1000,
      pound: 2.20462,
      ounce: 35.274,
      ton: 0.001,
    },
    temperature: {
      celsius: 'celsius',
      fahrenheit: 'fahrenheit',
      kelvin: 'kelvin',
    },
    volume: {
      liter: 1,
      milliliter: 1000,
      gallon: 0.264172,
      quart: 1.05669,
      pint: 2.11338,
      cup: 4.22675,
      fluid_ounce: 33.814,
    },
  };

  async execute(params: { 
    fromUnit: 'meter' | 'kilometer' | 'centimeter' | 'millimeter' | 'inch' | 'foot' | 'yard' | 'mile'; 
    toUnit: 'meter' | 'kilometer' | 'centimeter' | 'millimeter' | 'inch' | 'foot' | 'yard' | 'mile'; 
    value: number; 
  }): Promise<{ 
    success: boolean;
    message: string;
    data: {
      originalValue: number; 
      convertedValue: number; 
      fromUnit: string; 
      toUnit: string; 
      } | null;
    }> {
    try {
      const { value, fromUnit, toUnit } = params;

      if (!this.conversions['length']) {
        throw new Error(`Category "length" not supported. Supported categories: ${Object.keys(this.conversions).join(', ')}`);
      }

      const categoryConversions = this.conversions['length'];

      if (!categoryConversions[fromUnit] || !categoryConversions[toUnit]) {
        throw new Error(`Unit not supported in length. Supported units: ${Object.keys(categoryConversions).join(', ')}`);
      }

      // Convert to base unit first, then to target unit
      const baseValue = value / (categoryConversions[fromUnit] as number);
      const convertedValue = baseValue * (categoryConversions[toUnit] as number);

      return {
        success: true,
        message: 'Conversion successful',
        data: {
          originalValue: value,
          convertedValue: Math.round(convertedValue * 100000) / 100000, // Round to 5 decimal places
          fromUnit,
          toUnit
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      value: {
        type: 'number',
      },
      fromUnit: {
        type: 'string',
      },
      toUnit: {
        type: 'string',
      }
    };
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'swap-horizontal';
  }

  getDescription(): string {
    return 'Convert between different units of length (meter, kilometer, centimeter, millimeter, inch, foot, yard, mile)';
  }
} 