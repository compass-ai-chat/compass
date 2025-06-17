import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';
import { Document, Provider } from '../types/core';
import { documentsAtom } from '@/src/hooks/atoms';
import { getDefaultStore } from 'jotai';
import { searchRelevantPassages } from '../utils/semanticSearch';
import { ChatProviderFactory } from '../services/chat/ChatProviderFactory';

interface SearchResult {
  documentId: string;
  documentName: string;
  matches: Array<{
    text: string;
    similarity?: number;
    isExactMatch?: boolean;
  }>;
}

export class DocumentSearchTool implements ToolHandler {
  async execute(params: { documentIds: string[], searchQuery: string }, config: any): Promise<any> {
    const { documentIds, searchQuery } = params;
    const defaultStore = getDefaultStore();
    const allDocuments = await defaultStore.get(documentsAtom);
    
    // Filter documents by provided documentIds
    const targetDocuments = documentIds 
      ? allDocuments.filter(doc => documentIds.includes(doc.id))
      : allDocuments;

    if (targetDocuments.length === 0) {
      return {
        success: false,
        error: 'No documents found with the provided IDs'
      };
    }

    console.log("targetDocuments", targetDocuments);

    const results: SearchResult[] = [];
    
    // Create a provider for semantic search
    // const ollamaProvider: Provider = {
    //   id: 'ollama-local',
    //   name: 'Ollama',
    //   endpoint: 'http://localhost:11434',
    //   logo: null,
    //   capabilities: {
    //     llm: true,
    //     tts: false,
    //     stt: false,
    //     search: false,
    //     embedding: true
    //   }
    // };
    
    //const chatProvider = ChatProviderFactory.getProvider(ollamaProvider);

    for (const document of targetDocuments) {
      if (!document.chunks) {
        continue;
      }

      const searchResults: SearchResult = {
        documentId: document.id,
        documentName: document.name,
        matches: []
      };

      // Perform semantic search
      // try {
      //   const semanticResults = await searchRelevantPassages(
      //     searchQuery,
      //     document.content,
      //     chatProvider,
      //     {
      //       maxChunkSize: 512,
      //       minSimilarity: 0.6,
      //       maxResults: 3
      //     }
      //   );

      //   searchResults.matches.push(
      //     ...semanticResults.map(result => ({
      //       text: result.text,
      //       similarity: result.similarity
      //     }))
      //   );
      // } catch (error) {
      //   console.error('Semantic search failed:', error);
      // }

      // Perform classical search (case-insensitive)
      const searchTerms = searchQuery.toLowerCase().split(' ');
      
      for (let i = 0; i < document.chunks.length; i++) {
        const chunk = document.chunks[i];
        if (searchTerms.every((term: string) => chunk.toLowerCase().includes(term))) {
          // Check if this line isn't already included in semantic results
          if (!searchResults.matches.some(match => match.text.includes(chunk))) {
            searchResults.matches.push({
              text: chunk,
              isExactMatch: true
            });
          }
        }
      }

      if (searchResults.matches.length > 0) {
        results.push(searchResults);
      }
    }

    return {
      success: true,
      message: 'Search results',
      results
    };
  }

  getParamsSchema(): SimpleSchema {
    return {
      documentIds: { type: 'array' },
      searchQuery: { type: 'string' }
    };
  }

  getConfigSchema(): SimpleSchema {
    return {};
  }

  getIcon(): string {
    return 'search';
  }

  getDescription(): string {
    return 'Search through documents using semantic and classical search';
  }
} 