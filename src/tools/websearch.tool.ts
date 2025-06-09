//import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { ToolHandler } from './tool.interface';
import { userNotesAtom } from '@/src/hooks/atoms';
import { getDefaultStore } from 'jotai';
import { SearxngSearchService } from '@/src/services/search/SearxngSearchService';

export class WebSearchService implements ToolHandler {
  async execute(params: any, config: any): Promise<any> {

    try {

        const searchService = new SearxngSearchService('https://baresearch.org');
        const response = await searchService.search(params.query);
        const message = response.results.map((result: any) => result.content).join('\n');
        console.log("Web search gave message",message);

        return {
            success: true,
            message: message,
        };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getParamsSchema(): z.ZodSchema {
    return z.object({
      query: z.string()
    });
  }

  getConfigSchema(): z.ZodSchema {
    return z.object({
    });
  }

  getIcon(): string {
    return 'search';
  }

  getDescription(): string {
    return 'Search the web for information';
  }
  
} 