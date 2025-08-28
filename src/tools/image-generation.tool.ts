import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';
import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from "@ai-sdk/openai";
import { getDefaultStore } from 'jotai';
import { generatedImagesAtom } from '../hooks/atoms'; 

export class ImageGenerationService implements ToolHandler {
  async execute(params: { prompt: string }, config: { apiKey:string }): Promise<{ success: boolean, message: string, data: {id: string, imagePath: string}|null }> {

    try {

      // currently, to get started, we'll just grab apikey from OpenAI  
        const open = createOpenAI({
          apiKey: config.apiKey
        });
        const { image } = await generateImage({
          model: open.image('dall-e-3'),
          prompt: params.prompt,
          size: '1024x1024',
        });

        // Fallback for browsers that don't support File System Access API
        const blob = new Blob([image.uint8Array as any], {type: image.mediaType})
        const url = window.URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_${new Date().getTime()}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const defaultStore = getDefaultStore()
        const images = await defaultStore.get(generatedImagesAtom);
        const imageObj = { id: Date.now().toString(), imagePath: url, prompt: params.prompt, createdAt: new Date().toISOString() };

        defaultStore.set(generatedImagesAtom, [...images, imageObj]);

        //window.URL.revokeObjectURL(url);
        return {
          success: true,
          message: 'Image generation successful',
          data:{
            id: imageObj.id,
            imagePath: imageObj.imagePath
          }
        };

    } catch (error: any) {
      console.error('Error generating image:', error);
      return {
        success: false,
        message: 'Image generation failed',
        data: null
      };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      prompt: { type: 'string' }
    };
  }

  getConfigSchema(): SimpleSchema {
    return { apiKey: {type:'string'}};
  }

  getIcon(): string {
    return 'search';
  }

  getDescription(): string {
    return 'Generate an image from a prompt';
  }
  
} 