//import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { ToolHandler } from './tool.interface';
import { userNotesAtom } from '@/src/hooks/atoms';
import { getDefaultStore } from 'jotai';
import { SearxngSearchService } from '@/src/services/search/SearxngSearchService';
import { SimpleSchema } from '../utils/zodHelpers';

export class WebSearchService implements ToolHandler {
  async execute(params: { query: string }): Promise<{ success: boolean, message: string, data: string | null }> {

    try {

        const searchService = new SearxngSearchService('https://baresearch.org');
        const response = await searchService.search(params.query);
        const message = response.results.map((result: any) => result.content).join('\n');
        console.log("Web search gave message",message);

        return {
            success: true,
            message: 'Web search successful',
            data: message
        };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: 'Web search failed',
        data: null
      };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      query: { type: 'string' }
    };
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'search';
  }

  getDescription(): string {
    return 'Search the web for information';
  }
  
} 