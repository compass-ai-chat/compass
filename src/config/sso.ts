/**
 * SSO Configuration
 * 
 * Environment variables (set at build time):
 * - EXPO_PUBLIC_SSO_ENABLED: 'true' to enable SSO
 * - EXPO_PUBLIC_SSO_PROVIDER: 'openrouter' | 'custom'
 * - EXPO_PUBLIC_SSO_CLIENT_ID: OAuth client ID
 * - EXPO_PUBLIC_SSO_PROVIDER_NAME: Display name for the provider
 * - EXPO_PUBLIC_SSO_PROVIDER_ICON: Ionicons icon name
 */

export interface SSOProviderConfig {
  enabled: boolean;
  provider: 'openrouter' | 'custom';
  clientId: string;
  name: string;
  icon: string;
}

export interface AppSSOConfig {
  sso?: SSOProviderConfig;
}

// These get replaced at build time by environment variables
export const ssoConfig: AppSSOConfig = {
  sso: process.env.EXPO_PUBLIC_SSO_ENABLED === 'true'
    ? {
        enabled: true,
        provider: (process.env.EXPO_PUBLIC_SSO_PROVIDER as 'openrouter' | 'custom') || 'openrouter',
        clientId: process.env.EXPO_PUBLIC_SSO_CLIENT_ID || '',
        name: process.env.EXPO_PUBLIC_SSO_PROVIDER_NAME || 'OpenRouter',
        icon: process.env.EXPO_PUBLIC_SSO_PROVIDER_ICON || 'cloud-outline',
      }
    : undefined,
};

export const isOpenRouterSSOEnabled = (): boolean => {
  return ssoConfig.sso?.enabled === true && ssoConfig.sso?.provider === 'openrouter';
};

export const isSSOEnabled = (): boolean => {
  return ssoConfig.sso?.enabled === true;
};

export const getSSOConfig = (): SSOProviderConfig | undefined => {
  return ssoConfig.sso;
};
