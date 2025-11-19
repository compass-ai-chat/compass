import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ChatThread } from '@/src/components/chat/ChatThread';
import { TouchableOpacity, View, Platform } from 'react-native';
import { useAtomValue } from 'jotai';
import { threadsAtom } from '@/src/hooks/atoms';
import { useEffect, useLayoutEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threads = useAtomValue(threadsAtom);
  const currentThread = threads.find(t => t.id === id);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    const isMobile = Platform.OS !== 'web' || typeof window === 'undefined' || window.innerWidth < 768;
    navigation.setOptions({
      headerShown: !isMobile
    });
  }, [navigation]);

  useEffect(() => {
    if (!currentThread) {
      router.replace('/');
    }
  }, [id, currentThread]);

  return (
    <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1">
            <ChatThread />
        </View>
    </SafeAreaView>
  );
}