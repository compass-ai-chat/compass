import React, { useEffect } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { TabBarIcon } from './TabBarIcon';
import { useThemePreset } from '@/src/components/ui/ThemeProvider';
import { rawThemes } from '@/constants/themes';
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

const routes = [
  { key: 'index', title: 'chats.chats', icon: 'chatbubble' },
  { key: 'characters', title: 'characters.characters', icon: 'people' },
  { key: 'images', title: 'images.images', icon: 'image' },
  { key: 'documents', title: 'documents.documents', icon: 'document-text' },
  { key: 'settings', title: 'settings.settings', icon: 'cog' },
];

export function WebSidebar({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { themePreset, setThemePreset, availableThemes, theme } = useThemePreset();
  const { t } = useLocalization();

  const handleNavigation = (route: any, index: number) => {
    setCurrentIndex(index);
    
    // Use push instead of replace for more reliable navigation
    const path = route.key === 'index' ? '/' : `/${route.key}`;
    router.push(path as any);
  };

  return (
    <View 
      className={`h-full w-16 hover:w-48 transition-all duration-300 group ${className}`}
      style={{ 
        backgroundColor: theme.background, 
        borderRightWidth: 1, 
        borderRightColor: theme.border 
      }}
    >
      <View className="flex-1 py-4">
        {routes.map((route, index) => (
          <Pressable
            key={route.key}
            onPress={() => handleNavigation(route, index)}
            className={`flex-row items-center p-3 mx-2 my-1 rounded-lg transition-colors duration-200 ${
              currentIndex === index ? '' : ''
            }`}
            style={{
              backgroundColor: currentIndex === index ? theme.surface : 'transparent',
              borderLeftWidth: currentIndex === index ? 2 : 0,
              borderLeftColor: currentIndex === index ? theme.primary : 'transparent'
            }}
          >
            <View className="w-6 h-6 items-center justify-center">
              <TabBarIcon
                name={route.icon as any}
                size={22}
                style={{ 
                  color: currentIndex === index ? theme.primary : theme.secondary 
                }}
              />
            </View>
            <Text
              className={`ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium`}
              style={{ 
                color: currentIndex === index ? theme.primary : theme.text 
              }}
            >
              {t(route.title)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="p-2">
        <LanguageSelector className='opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
      </View>
    </View>
  );
} 