import React from 'react';
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon';
import { Platform, useWindowDimensions, View } from 'react-native';
import { useColorScheme, vars } from 'nativewind';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import IndexRoute from './index';
import CharactersRoute from './characters';
import SettingsRoute from './settings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreset } from '@/src/components/ui/ThemeProvider';
import { rawThemes } from '@/constants/themes';
import { currentIndexAtom } from '@/src/hooks/atoms';
import { useAtom } from 'jotai';
import ImagesRoute from './images';
import DocumentsRoute from './documents';
import { Slot } from 'expo-router';
import ToolsRoute from './tools';
const renderScene = SceneMap({
  index: IndexRoute,
  characters: CharactersRoute,
  images: ImagesRoute,
  settings: SettingsRoute,
  documents: DocumentsRoute,
  tools: ToolsRoute,
});

export const routes = [
  { key: 'index', title: 'chats.chats', icon: 'chatbubble' },
  { key: 'characters', title: 'characters.characters', icon: 'people' },
  { key: 'tools', title: 'tools.tools', icon: 'hammer' },
  { key: 'images', title: 'images.images', icon: 'image' },
  { key: 'documents', title: 'documents.documents', icon: 'document-text' },
  { key: 'settings', title: 'settings.settings', icon: 'cog' },
  
];

export default function TabLayout() {
  const isDesktop = Platform.OS === 'web' && window.innerWidth >= 768;
  const layout = useWindowDimensions();
  const [index, setIndex] = useAtom(currentIndexAtom);

  const { colorScheme } = useColorScheme();
  const { themePreset } = useThemePreset();
  let theme = {} as any;
  if(!rawThemes[themePreset]){
    theme = rawThemes['default'][colorScheme ?? 'light'];
  }
  else{
    theme = rawThemes[themePreset][colorScheme ?? 'light'];
  }
  
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={{ 
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
      indicatorStyle={{
        backgroundColor: theme.primary,
      }}
      activeColor={theme.primary}
      inactiveColor={theme.secondary}
      labelStyle={{
        textTransform: 'none',
      }}
    />
  );

  if (isDesktop) {
    // Use Slot for proper routing on desktop
    return <View className="flex-1"><Slot /></View>;
  }
  
  return (
    <SafeAreaView className="flex-1">
      <TabView
        tabBarPosition='bottom'
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        commonOptions={{
          labelText:"",
          icon: ({ route, focused, color }) => {
            return <TabBarIcon name={route.icon as any} size={22} className={`${focused ? '!text-primary' : '!text-secondary'}`}/>;
          },
        }}
      />
    </SafeAreaView>
  );
}
