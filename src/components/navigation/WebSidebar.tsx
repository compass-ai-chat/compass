import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { TabBarIcon } from './TabBarIcon';
import { useThemePreset } from '@/src/components/ui/ThemeProvider';
import { rawThemes } from '@/constants/themes';
import { useColorScheme } from 'nativewind';
import { routes } from '@/app/(tabs)/_layout';
import { currentIndexAtom, syncToPolarisAtom } from '@/src/hooks/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { polarisCharactersAtom, polarisProvidersAtom, polarisDocumentsAtom } from '@/src/hooks/atoms';
import { useLocalization } from '@/src/hooks/useLocalization';
import { LanguageSelector } from '../LanguageSelector';

interface Route {
  key: string;
  title: string;
  icon: string;
}

export function WebSidebar({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom);
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { themePreset, setThemePreset, availableThemes } = useThemePreset();
  const theme = rawThemes[themePreset][colorScheme ?? 'light'];
  const { t } = useLocalization();

  const handleNavigation = (route: any, index: number) => {
    setCurrentIndex(index);
    
    // Use push instead of replace for more reliable navigation
    const path = route.key === 'index' ? '/' : `/${route.key}`;
    router.push(path as any);
  };

  return (
    <View className={`group h-full ${className}`}>
      {routes.map((route, index) => (
        <Pressable
          key={route.key}
          onPress={() => handleNavigation(route, index)}
          className={`group-hover:w-32 z-20 w-14 transition-all duration-200 flex-row items-center justify-between p-4 m-2 rounded-lg hover:bg-surface ${
            currentIndex === index
              ? 'border-r border-primary border shadow-sm bg-surface'
              : ''
          }`}
        >
          <TabBarIcon
            name={route.icon as any}
            size={22}
            className={`w-12 ${currentIndex === index ? '!text-primary' : '!text-secondary'}`}
          />
          <Text
            className={`text-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              currentIndex === index ? 'text-primary' : 'text-secondary'
            }`}
          >
            {t(route.title)}
          </Text>
        </Pressable>
      ))}
      <LanguageSelector className='mt-auto m-2 w-full px-2' />
    </View>
  );
} 