//import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { ToolHandler } from './tool.interface';
import { userNotesAtom } from '@/src/hooks/atoms';
import { getDefaultStore } from 'jotai';
import { SimpleSchema } from '../utils/zodHelpers';

import * as Location from 'expo-location';

export class LocationToolService implements ToolHandler {
  async execute(params: {}, config: {}): Promise<any> {

    try {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Permission to access location was denied'
        };
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log('Location:', location);
      return {
        success: true,
        message: 'Location fetched successfully',
        data: {
          altidude: location.coords.altitude,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      };

    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {};
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'map-marker';
  }

  getDescription(): string {
    return 'Get the current location';
  }
} 