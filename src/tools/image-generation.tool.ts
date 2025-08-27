import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

export class ImageGenerationService implements ToolHandler {
  async execute(params: { prompt: string }): Promise<{ success: boolean, message: string, data: string | null }> {

    try {

        const { image } = await generateImage({
          model: openai.image('dall-e-3'),
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
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          message: 'Image generation successful',
          data: image.base64
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
    return {};
  }

  getIcon(): string {
    return 'search';
  }

  getDescription(): string {
    return 'Search the web for information';
  }
  
} 