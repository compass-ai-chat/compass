import React, { Suspense } from 'react';
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useThemePreset } from '@/src/components/ui/ThemeProvider';
import { rawThemes } from '@/constants/themes';
import { Slot, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

const TabLoadingFallback = () => (
  <View className="flex-1 bg-background items-center justify-center">
    <ActivityIndicator size="large" />
  </View>
);

export default function TabLayout() {
  const { t } = useTranslation();
  const isDesktop = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth >= 768;

  const { theme } = useThemePreset();

  if (isDesktop) {
    // Use Slot for proper routing on desktop
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <View className="flex-1"><Slot /></View>
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={<TabLoadingFallback />}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.secondary,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
          headerShown: false,
        }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('chats.chats'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chatbubble" size={22} color={focused?theme.primary:theme.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: t('characters.characters'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="people" size={22} color={focused?theme.primary:theme.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="images"
        options={{
          title: t('images.images'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="image" size={22} color={focused?theme.primary:theme.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t('documents.documents'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="document-text" size={22} color={focused?theme.primary:theme.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.settings'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="cog" size={22} color={focused?theme.primary:theme.secondary} />
          ),
        }}
      />
      </Tabs>
    </Suspense>
  );
}
