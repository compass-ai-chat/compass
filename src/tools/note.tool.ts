//import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { ToolHandler } from './tool.interface';
import { userNotesAtom } from '@/src/hooks/atoms';
import { getDefaultStore } from 'jotai';

export class NoteToolService implements ToolHandler {
  async execute(params: any, config: any): Promise<any> {
    // get default store
    const defaultStore = getDefaultStore();

    try {

        const note = {
            title: params.title,
            content: params.content,
            createdAt: new Date()
        }

        defaultStore.set(userNotesAtom, [...(await defaultStore.get(userNotesAtom)), note]);

        console.log('Note created successfully', note);
      return {
        success: true,
        message: 'Note created successfully'
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
      title: z.string(),
      content: z.string()
    });
  }

  getConfigSchema(): z.ZodSchema {
    return z.object({
    });
  }

  getIcon(): string {
    return 'pencil';
  }

  getDescription(): string {
    return 'Create a note';
  }
} 