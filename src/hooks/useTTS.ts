import { useCallback, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { Platform } from 'react-native';
import { availableProvidersAtom, ttsEnabledAtom, defaultVoiceAtom } from '@/src/hooks/atoms';
import { ttsService, TTSOptions } from '@/src/services/ttsService';

export function useTTS() {
  const providers = useAtomValue(availableProvidersAtom);
  const ttsEnabled = useAtomValue(ttsEnabledAtom);
  const isStreamingRef = useRef(false);
  const isWeb = Platform.OS === 'web';
  const selectedVoice = useAtomValue(defaultVoiceAtom);

  const getElevenLabsProvider = useCallback(() => {
    return providers.find(p => p.name?.toLowerCase().includes('elevenlabs'));
  }, [providers]);

  const streamText = useCallback(async (text: string) => {
    if (!isWeb || !ttsEnabled) {
      return;
    }

    const elevenLabsProvider = getElevenLabsProvider();
    if (!elevenLabsProvider?.apiKey) {
      console.warn('ElevenLabs provider not configured');
      return;
    }

    isStreamingRef.current = true;

    const options: TTSOptions = {
      apiKey: elevenLabsProvider.apiKey,
      voiceId: selectedVoice?.id
    };

    try {
      await ttsService.streamText(text, options, {
        onStart: () => {
          console.log('TTS streaming started');
        },
        onAudioReady: (audioChunks: Uint8Array) => {
          // Handle each audio chunk if needed
        },
        onError: (error: Error) => {
          console.error('TTS streaming error:', error);
          isStreamingRef.current = false;
        },
        onFinish: () => {
          console.log('TTS streaming finished');
          isStreamingRef.current = false;
        }
      });
    } catch (error) {
      console.error('Failed to start TTS streaming:', error);
      isStreamingRef.current = false;
    }
  }, [getElevenLabsProvider, isWeb, ttsEnabled, selectedVoice]);

  const stopStreaming = useCallback(() => {
    if (isStreamingRef.current && isWeb) {
      ttsService.stop();
      isStreamingRef.current = false;
    }
  }, [isWeb]);

  return {
    streamText,
    stopStreaming,
    isStreaming: isStreamingRef.current,
    isSupported: isWeb
  };
} 