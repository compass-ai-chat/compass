import LogService from "@/utils/LogService";
import { MentionedCharacter } from "../components/chat/ChatInput";
import { ChatProviderFactory } from "../services/chat/ChatProviderFactory";
import { Thread } from "../types/core";
import { ChatMessage } from "../types/core";
import { Character } from "../types/core";
import { Document } from "../types/core";
import { searchRelevantPassages } from "../utils/semanticSearch";
import { toastService } from "../services/toastService";
import { fetchSiteText } from "../utils/siteFetcher";
import { isSearchRequired } from '../utils/semanticSearch';
import { ChatProvider } from "../types/chat";



export const urlContentTransform: MessageTransform = {
    name: 'urlContent',
    transform: async (ctx: MessageContext): Promise<MessageContext> => {
      const urls = ctx.message.match(/https?:\/\/[^\s]+/g);
      if (!urls?.length) return ctx;
  
      toastService.info({ 
        title: 'Processing URLs', 
        description: 'Fetching content from links...' 
      });
  
      const webContent: string[] = [];
      
      for (const url of urls) {
        try {
          const content = await fetchSiteText(url);
          webContent.push(`Content from ${url}:\n${content}\n`);
        } catch (error: any) {
          LogService.log(error, { 
            component: 'urlContentTransform', 
            function: 'transform' 
          }, 'error');
          toastService.warning({
            title: 'URL Processing Error',
            description: `Failed to process ${url}`
          });
        }
      }
  
      // Store web content in metadata for next transform
      ctx.metadata.webContent = webContent;
      ctx.metadata.urls = urls;
      
      return ctx;
    }
  };

export const relevantPassagesTransform: MessageTransform = {
    name: 'relevantPassages',
    transform: async (ctx: MessageContext): Promise<MessageContext> => {
      const { webContent, urls } = ctx.metadata;
      if (!webContent?.length) return ctx;
      if(!ctx.thread.selectedModel) return ctx;
  
      const messageWithoutUrls = ctx.message.replace(urls.join('|') || '', '');
      const relevantPassages = await searchRelevantPassages(
        messageWithoutUrls,
        webContent.join('\n'),
        ChatProviderFactory.getProvider(ctx.thread.selectedModel.provider),
        {
          maxChunkSize: 512,
          minSimilarity: 0.3,
          maxResults: 5
        }
      );
      console.log("relevantPassages",relevantPassages);
      if (relevantPassages.length > 0) {
        ctx.context.messagesToSend.push({
          content: `Web content context:\n${relevantPassages.map(p => p.text).join('\n')}`,
          isSystem: true,
          isUser: false
        });
      }
  
      return ctx;
    }
  };

export const webSearchTransform: MessageTransform = {
  name: 'webSearch',
  transform: async (ctx: MessageContext): Promise<MessageContext> => {
    if (!ctx.metadata.searchEnabled) return ctx;

    const searchRequired = await isSearchRequired(
      ctx.message,
      ctx.provider,
      ctx.thread
    );

    if (searchRequired.searchRequired) {
      const searchResponse = await ctx.metadata.searchFunction(searchRequired.query);
      if (searchResponse?.results?.length && searchResponse?.results?.length > 0) {
        ctx.context.messagesToSend.push({
          content: `Web search results: ${searchResponse.results.slice(0,3).map((result: any) => result.content).join('\n')}`,
          isSystem: true,
          isUser: false
        });
      }
    }

    return ctx;
  }
};

export const threadUpdateTransform: MessageTransform = {
  name: 'threadUpdate',
  transform: async (ctx: MessageContext): Promise<MessageContext> => {
    const updatedThread = {
      ...ctx.thread,
      messages: [...ctx.metadata.messages, {content: ctx.message, isUser: true}, ctx.context.assistantPlaceholder]
    };

    await ctx.metadata.dispatchThread({
      type: 'update',
      payload: updatedThread
    });

    ctx.metadata.updatedThread = updatedThread;
    return ctx;
  }
};

export const firstMessageTransform: MessageTransform = {
  name: 'firstMessage',
  transform: async (ctx: MessageContext): Promise<MessageContext> => {
    const isFirstMessage = ctx.thread.messages.length === 0;
    if (!isFirstMessage || !ctx.thread.selectedModel) return ctx;

    const systemPrompt = `Based on the user message, generate a concise 3-word title that captures the essence of the conversation. Format: "Word1 Word2 Word3" (no quotes, no periods but do include spaces).`;

    try {
      const title = await ctx.provider.sendSimpleMessage(ctx.message, ctx.thread.selectedModel, systemPrompt);
      await new Promise(resolve => setTimeout(resolve, 200));

      // limit title to 5 words
      const titleWords = title.split(' ');
      const limitedTitle = titleWords.slice(0, 5).join(' ');

      await ctx.metadata.dispatchThread({
        type: 'update',
        payload: { ...ctx.metadata.updatedThread, title: limitedTitle }
      });
    } catch (error: any) {
      toastService.danger({
        title: 'Error generating title',
        description: error.message
      });
      LogService.log(error, { component: 'firstMessageTransform', function: 'transform' }, 'error');
    }

    return ctx;
  }
};

export const documentContextTransform: MessageTransform = {
  name: 'documentContext',
  transform: async (ctx: MessageContext): Promise<MessageContext> => {
    const character = ctx.context.characterToUse;
    if(!character) return ctx;

    let documentIds = ctx.thread.metadata?.documentIds ?? [];
    documentIds.push(...character.documentIds ?? []);

    // remove duplicates
    documentIds = [...new Set(documentIds)];
    
    if (!documentIds.length) return ctx;

    const documents = ctx.metadata.documents || [];
    const relevantDocs = documents.filter((doc: Document) => 
      documentIds.includes(doc.id)
    );

    console.log("we have ", documentIds, "and these are relevant", relevantDocs.map((doc: Document) => doc.id));

    if (!relevantDocs.length) return ctx;

    const allText = relevantDocs.map((doc: Document) => doc.chunks?.join('\n') || '').join('\n');
    
    const relevantPassages = await searchRelevantPassages(
      ctx.message,
      allText,
      ctx.provider,
      {
        maxChunkSize: 512,
        minSimilarity: 0.3,
        maxResults: 3
      }
    );

    console.log("relevantPassages",relevantPassages);

    if (relevantPassages.length > 0) {
      ctx.context.messagesToSend.push({
        content: `Relevant document context:\n${relevantPassages.map(p => p.text).join('\n')}`,
        isSystem: false,
        isUser: true
      });
    }

    return ctx;
  }
};

export const templateVariableTransform: MessageTransform = {
  name: 'templateVariable',
  transform: async (ctx: MessageContext): Promise<MessageContext> => {
    const character = ctx.context.characterToUse;
    
    // Skip if no character content or no messages to process
    if (!character?.content || ctx.context.messagesToSend.length === 0) {
      return ctx;
    }
    
    // Process template variables in character content
    let processedContent = ctx.systemPrompt;
    
    // Replace date/time variables
    const now = new Date();
    
    // Format: YYYY-MM-DD
    processedContent = processedContent.replace(/\${current-date}/g, 
      now.toLocaleDateString());
    
    // Format: HH:MM:SS
    processedContent = processedContent.replace(/\${current-time}/g, 
      now.toLocaleTimeString());
    
    // Format: YYYY-MM-DD HH:MM:SS
    processedContent = processedContent.replace(/\${current-datetime}/g, 
      now.toLocaleString());
    
    // Day of week: Monday, Tuesday, etc.
    processedContent = processedContent.replace(/\${day-of-week}/g, 
      now.toLocaleDateString(undefined, { weekday: 'long' }));
    
    // Month name: January, February, etc.
    processedContent = processedContent.replace(/\${month-name}/g, 
      now.toLocaleDateString(undefined, { month: 'long' }));
    
    // Current year: 2023, 2024, etc.
    processedContent = processedContent.replace(/\${year}/g, 
      now.getFullYear().toString());
    
    // User name - this would need to be provided in the context
    // For now, use a placeholder or get from user settings
    const userName = ctx.metadata.userName || "User";
    processedContent = processedContent.replace(/\${user-name}/g, userName);
    
    // Update the character content for this conversation
    const updatedCharacter = {
      ...character,
      processedContent
    };
    
    // Update the character in the context
    ctx.context.characterToUse = updatedCharacter;
    
    ctx.systemPrompt = processedContent;
    
    return ctx;
  }
};

export class MessageTransformPipeline {
  private transforms: MessageTransform[] = [];

  addTransform(transform: MessageTransform) {
    this.transforms.push(transform);
    return this;
  }

  async process(initialContext: MessageContext): Promise<MessageContext> {
    return this.transforms.reduce(
      async (contextPromise, transform) => {
        const context = await contextPromise;
        try {
          return await transform.transform(context);
        } catch (error: any) {
          LogService.log(error, {
            component: 'MessageTransformPipeline',
            function: transform.name
          }, 'error');
          return context; // Continue pipeline even if one transform fails
        }
      },
      Promise.resolve(initialContext)
    );
  }
}

export interface MessageContext {
  message: string;
  provider: ChatProvider;
  thread: Thread;
  mentionedCharacters: MentionedCharacter[];
  systemPrompt: string;
  context: {
    messagesToSend: ChatMessage[];
    historyToSend: ChatMessage[];
    assistantPlaceholder: ChatMessage;
    useMention: boolean;
    characterToUse: Character | undefined;
  };
  metadata: Record<string, any>; // For storing intermediate data between transforms
}

export interface MessageTransform {
  name: string;
  transform: (ctx: MessageContext) => Promise<MessageContext>;
}