import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAtom } from 'jotai';
import { ssoConfig, isOpenRouterSSOEnabled, isSSOEnabled } from '@/src/config/sso';
import { openRouterAuth } from '@/src/services/auth/openRouterAuth';
import { ssoAuthStateAtom, SSOAuthState } from '@/src/hooks/authAtoms';
import { availableProvidersAtom } from '@/src/hooks/atoms';
import { getOpenRouterSSOProviderId } from '@/src/services/providers/openRouterProvider';
import { toastService } from '@/src/services/toastService';
import { useLocalization } from '@/src/hooks/useLocalization';

interface SignInButtonProps {
  className?: string;
  compact?: boolean;
}

export const SignInButton: React.FC<SignInButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [ssoAuthState, setSsoAuthState] = useAtom(ssoAuthStateAtom);
  const [providers, setProviders] = useAtom(availableProvidersAtom);

  // Initialize auth state on mount
  useEffect(() => {
    openRouterAuth.initialize();
  }, []);

  // Don't render if SSO is not enabled
  if (!isSSOEnabled()) {
    return null;
  }

  const handlePress = async () => {
    if (ssoAuthState.isAuthenticated) {
      // Logout
      await openRouterAuth.logout();
      
      // Update auth state
      await setSsoAuthState({
        isAuthenticated: false,
        user: null,
        apiKey: null,
      });

      // Remove the SSO provider
      const existingProviders = await providers;
      const filteredProviders = existingProviders.filter(
        (p) => p.id !== getOpenRouterSSOProviderId()
      );
      await setProviders(filteredProviders);

      toastService.success({
        title: String(t('auth.signed_out')),
        description: String(t('auth.signed_out_description')),
      });
    } else {
      // Login
      setLoading(true);
      try {
        await openRouterAuth.initiateLogin();
      } catch (error) {
        console.error('Login error:', error);
        toastService.danger({
          title: String(t('auth.login_failed')),
          description: error instanceof Error ? error.message : String(t('auth.unknown_error')),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const config = ssoConfig.sso;
  const iconName = (config?.icon || 'log-in-outline') as keyof typeof Ionicons.glyphMap;

  // Authenticated state - show user info
  if (ssoAuthState.isAuthenticated && ssoAuthState.user) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border ${className}`}
      >
        <Ionicons name="person-circle" size={24} className="!text-primary mr-2" />
        {!compact && (
          <View className="flex-1">
            <Text className="text-text font-medium" numberOfLines={1}>
              {ssoAuthState.user.name || ssoAuthState.user.email || 'Signed In'}
            </Text>
            <Text className="text-secondary text-xs" numberOfLines={1}>
              via {config?.name || 'SSO'}
            </Text>
          </View>
        )}
        <Ionicons name="log-out-outline" size={18} className="!text-secondary ml-2" />
      </TouchableOpacity>
    );
  }

  // Authenticated but no user info
  if (ssoAuthState.isAuthenticated) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`flex-row items-center bg-surface rounded-lg px-3 py-2 border border-primary ${className}`}
      >
        <Ionicons name="checkmark-circle" size={24} className="!text-primary mr-2" />
        {!compact && (
          <Text className="text-text font-medium flex-1">
            {String(t('auth.connected_to'))} {config?.name || 'SSO'}
          </Text>
        )}
        <Ionicons name="log-out-outline" size={18} className="!text-secondary ml-2" />
      </TouchableOpacity>
    );
  }

  // Not authenticated - show sign in button
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      className={`flex-row items-center justify-center bg-primary rounded-lg px-4 py-3 ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          <Ionicons name={iconName} size={20} color="white" />
          {!compact && (
            <Text className="text-white font-medium ml-2">
              {String(t('auth.sign_in_with'))} {config?.name || 'SSO'}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default SignInButton;
