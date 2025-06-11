import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';

export class WeatherToolService implements ToolHandler {

  async convertPlaceNameToCoordinates(placeName: string): Promise<{ lat: number, lon: number }> {
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${placeName}&count=1&language=en&format=json`);
      const data = await response.json() as { results: { latitude: number, longitude: number }[] }
      if (data.results.length === 0) {
        throw new Error('No results found');
      }
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    } catch (error) {
      throw new Error('Failed to convert place name to coordinates');
    }
  }

  async getWeatherData(lat: number, lon: number): Promise<{ temperature: number, unit: string }> {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`);
    const data = await response.json() as { current_units: { temperature_2m: string }, current: {temperature_2m: number} };
    return { temperature: data.current.temperature_2m, unit: data.current_units.temperature_2m };
  }

  async execute(params: { location: string }): Promise<{ 
    success: boolean;
    message: string;
    data: {
      temperature: string; 
    } | null;
  }> {
    try {
      const { lat, lon } = await this.convertPlaceNameToCoordinates(params.location);
      const { temperature, unit } = await this.getWeatherData(lat, lon);

      const temperatureString = `${temperature}${unit}`;
      
      
      return {
        success: true,
        message: 'Weather data fetched successfully',
        data: {
          temperature: temperatureString,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch weather data',
        data: null
      };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      location: {
        type: 'string',
      },
    };
  }

  getConfigSchema(): SimpleSchema {
    return {
    };
  }

  getIcon(): string {
    return 'cloud';
  }

  getDescription(): string {
    return 'Get current weather information for any location';
  }
} 