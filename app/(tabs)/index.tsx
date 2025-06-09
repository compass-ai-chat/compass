import { View, Platform } from 'react-native';
import { ChatThread } from '@/src/components/chat/ChatThread';
import { ChatThreads } from '@/src/components/chat/ChatThreads';
import { useAtom } from 'jotai';
import { sidebarVisibleAtom } from '@/src/hooks/atoms';
import { ThreadsSidebar } from '@/src/components/web/ThreadsSidebar';
import { useWindowDimensions, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLayoutEffect } from 'react';

const MIN_DESKTOP_WIDTH = 768;

export default function HomeScreen() {
  
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= MIN_DESKTOP_WIDTH;
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (isDesktop) {
    return (
      <View className="flex-1 flex-row">
        <View className="flex-1 rounded-t-xl">
          <ChatThread />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center p-4">
        <Ionicons name="compass" size={36} className='!text-primary' />
        <Text className="ms-2 text-2xl font-bold text-primary">Compass</Text>
      </View>
      <ChatThreads />
    </View>
  );
}
