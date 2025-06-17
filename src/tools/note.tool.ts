import { ToolHandler } from './tool.interface';
import { documentsAtom } from '@/src/hooks/atoms';
import { getDefaultStore } from 'jotai';
import { SimpleSchema } from '../utils/zodHelpers';
import { Document } from '../types/core';
import { v4 as uuidv4 } from 'uuid';

export class NoteToolService implements ToolHandler {
  async execute(params: any, config: any): Promise<any> {
    // get default store
    const defaultStore = getDefaultStore();

    try {
        const newNote: Document = {
            id: uuidv4(),
            name: params.title,
            type: "note",
            content: params.content,
            createdAt: new Date()
        };

        const currentDocs = await defaultStore.get(documentsAtom);
        await defaultStore.set(documentsAtom, [...currentDocs, newNote]);

        console.log('Note created successfully', newNote);
        return {
            success: true,
            message: 'Note created successfully'
        };

    } catch (error: any) {
        console.error('Error creating note:', error);
        return {
            success: false,
            error: error.message
        };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      title: { type: 'string' },
      content: { type: 'string' }
    };
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'pencil';
  }

  getDescription(): string {
    return 'Create a note';
  }
} 