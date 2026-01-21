import { Provider } from '@/src/types/core';
import { openRouterAuth } from '@/src/services/auth/openRouterAuth';
import { PROVIDER_LOGOS } from '@/src/constants/logos';

const OPENROUTER_PROVIDER_ID = 'openrouter-sso';

/**
 * Creates an OpenRouter provider configuration using the SSO API key.
 * Returns null if no API key is available.
 */
export const createOpenRouterSSOProvider = (): Provider | null => {
  const apiKey = openRouterAuth.getApiKey();

  if (!apiKey) return null;

  return {
    id: OPENROUTER_PROVIDER_ID,
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1',
    apiKey,
    capabilities: {
      llm: true,
      tts: false,
      stt: false,
      search: false,
      image: true,
      embedding: false,
    },
    logo: 'https://openrouter.ai/favicon.ico',
    keyRequired: true,
    signupUrl: 'https://openrouter.ai/',
  };
};

/**
 * Checks if the given provider is the SSO-created OpenRouter provider
 */
export const isOpenRouterSSOProvider = (provider: Provider): boolean => {
  return provider.id === OPENROUTER_PROVIDER_ID;
};

/**
 * Get the OpenRouter SSO provider ID
 */
export const getOpenRouterSSOProviderId = (): string => {
  return OPENROUTER_PROVIDER_ID;
};
