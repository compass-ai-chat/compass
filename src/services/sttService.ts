import { Provider } from '@/src/types/core';

export interface TranscriptionOptions {
  fileUri: string;
  providers: Provider[];
  language?: string;
}

export async function transcribeAudio({ fileUri, providers, language }: TranscriptionOptions): Promise<string> {
  // Prefer providers explicitly supporting STT, then fall back to OpenAI/Groq heuristics
  const sttCapable = providers.find(p => p.capabilities?.stt);
  const openai = providers.find(p => (p.name || '').toLowerCase().includes('openai'));
  const groq = providers.find(p => (p.name || '').toLowerCase().includes('groq'));

  const provider = sttCapable || openai || groq;
  if (!provider || !provider.apiKey || !provider.endpoint) {
    throw new Error('No STT-capable provider configured. Add OpenAI or Groq with an API key.');
  }

  // Determine endpoint/model per provider
  const providerName = (provider.name || '').toLowerCase();
  const isGroq = providerName.includes('groq');
  const isOpenAI = providerName.includes('openai') || provider.capabilities?.stt;

  // Groq uses OpenAI-compatible path prefix
  const baseUrl = isGroq ? `${provider.endpoint}/openai/v1` : `${provider.endpoint}/v1`;
  const url = `${baseUrl}/audio/transcriptions`;

  // Reasonable default model names
  const model = isGroq ? 'whisper-large-v3' : 'whisper-1';

  // RN FormData supports { uri, name, type }
  const form = new FormData();
  form.append('file', {
    // @ts-expect-error React Native file shape
    uri: fileUri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  });
  form.append('model', model);
  if (language) form.append('language', language);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
  };

  // DO NOT set Content-Type; RN will set multipart boundary automatically
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: form as any,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Transcription failed: ${res.status} ${res.statusText} ${text}`);
  }

  // OpenAI-compatible APIs return { text: string } or { text: string, ... }
  const data = await res.json();
  const text: string | undefined = data.text || data?.results?.[0]?.alternatives?.[0]?.transcript;
  if (!text) {
    throw new Error('Transcription returned no text');
  }
  return text;
} 