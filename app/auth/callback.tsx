import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSetAtom, useAtom } from 'jotai';
import { openRouterAuth } from '@/src/services/auth/openRouterAuth';
import { ssoAuthStateAtom } from '@/src/hooks/authAtoms';
import { availableProvidersAtom } from '@/src/hooks/atoms';
import { createOpenRouterSSOProvider, getOpenRouterSSOProviderId } from '@/src/services/providers/openRouterProvider';
import { toastService } from '@/src/services/toastService';
import { isOpenRouterSSOEnabled } from '@/src/config/sso';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [ssoAuthState, setSsoAuthState] = useAtom(ssoAuthStateAtom);
  const [providers, setProviders] = useAtom(availableProvidersAtom);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the callback URL from the current location
        const callbackUrl = typeof window !== 'undefined'
          ? window.location.href
          : '';

        if (!callbackUrl) {
          throw new Error('No callback URL available');
        }

        // Process the OAuth callback
        const authState = await openRouterAuth.handleCallback(callbackUrl);

        // Update SSO auth state
        await setSsoAuthState({
          isAuthenticated: true,
          user: authState.user ? {
            ...authState.user,
            provider: 'openrouter',
          } : null,
          apiKey: authState.apiKey,
        });

        // Create and add the OpenRouter provider
        const openRouterProvider = createOpenRouterSSOProvider();
        if (openRouterProvider) {
          // Remove any existing SSO provider and add the new one
          const existingProviders = await providers;
          const filteredProviders = existingProviders.filter(
            (p) => p.id !== getOpenRouterSSOProviderId()
          );
          await setProviders([...filteredProviders, openRouterProvider]);
        }

        toastService.success({
          title: 'Signed in successfully',
          description: 'OpenRouter has been configured automatically',
        });

        // Return to the previous page or home
        const returnUrl = typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('auth_return_url')
          : null;
        
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('auth_return_url');
        }

        // Navigate back
        router.replace(returnUrl ? (returnUrl as any) : '/');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleAuth();
  }, [setSsoAuthState, setProviders]);

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-red-500 text-lg mb-4 font-bold">Authentication Failed</Text>
        <Text className="text-secondary text-center mb-6">{error}</Text>
        <Text
          className="text-primary underline"
          onPress={() => router.replace('/')}
        >
          Return to Home
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" className="mb-4" />
      <Text className="text-text text-lg">Completing sign in...</Text>
      <Text className="text-secondary mt-2">Please wait while we set up your account</Text>
    </View>
  );
};

export default AuthCallback;
