import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';

export class UnitConverterToolService implements ToolHandler {
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
    category: 'length' | 'weight' | 'temperature' | 'volume'; 
    fromUnit: string; 
    toUnit: string; 
    value: number; 
  }): Promise<{ 
    originalValue: number; 
    convertedValue: number; 
    fromUnit: string; 
    toUnit: string; 
    category: 'length' | 'weight' | 'temperature' | 'volume'; 
  }> {
    try {
      const { value, fromUnit, toUnit, category } = params;

      if (!this.conversions[category]) {
        throw new Error(`Category "${category}" not supported. Supported categories: ${Object.keys(this.conversions).join(', ')}`);
      }

      const categoryConversions = this.conversions[category];

      // Special handling for temperature
      if (category === 'temperature') {
        const convertedValue = this.convertTemperature(value, fromUnit, toUnit);
        return {
          originalValue: value,
          convertedValue,
          fromUnit,
          toUnit,
          category,
        };
      }

      if (!categoryConversions[fromUnit] || !categoryConversions[toUnit]) {
        throw new Error(`Unit not supported in ${category}. Supported units: ${Object.keys(categoryConversions).join(', ')}`);
      }

      // Convert to base unit first, then to target unit
      const baseValue = value / (categoryConversions[fromUnit] as number);
      const convertedValue = baseValue * (categoryConversions[toUnit] as number);

      return {
        originalValue: value,
        convertedValue: Math.round(convertedValue * 100000) / 100000, // Round to 5 decimal places
        fromUnit,
        toUnit,
        category,
      };
    } catch (error) {
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertTemperature(value: number, fromUnit: string, toUnit: string): number {
    let celsius: number;

    // Convert to Celsius first
    switch (fromUnit) {
      case 'celsius':
        celsius = value;
        break;
      case 'fahrenheit':
        celsius = (value - 32) * 5 / 9;
        break;
      case 'kelvin':
        celsius = value - 273.15;
        break;
      default:
        throw new Error(`Unsupported temperature unit: ${fromUnit}`);
    }

    // Convert from Celsius to target unit
    switch (toUnit) {
      case 'celsius':
        return Math.round(celsius * 100) / 100;
      case 'fahrenheit':
        return Math.round((celsius * 9 / 5 + 32) * 100) / 100;
      case 'kelvin':
        return Math.round((celsius + 273.15) * 100) / 100;
      default:
        throw new Error(`Unsupported temperature unit: ${toUnit}`);
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
      },
      category: {
        type: 'string',
      },
    };
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'swap-horizontal';
  }

  getDescription(): string {
    return 'Convert between different units of measurement (length, weight, temperature, volume)';
  }
} 