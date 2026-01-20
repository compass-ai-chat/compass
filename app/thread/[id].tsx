import { useLocalSearchParams } from 'expo-router';
import { ChatThread } from '@/src/components/chat/ChatThread';
import { TouchableOpacity, View, Platform } from 'react-native';
import { useAtomValue } from 'jotai';
import { currentThreadIdAtom } from '@/src/hooks/atoms';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentThreadId = useAtomValue(currentThreadIdAtom);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Only redirect if the thread id doesn't match on initial mount
    // Don't re-check on every render to avoid flicker
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      if (!id) {
        router.replace('/');
      }
    }
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1">
            <ChatThread />
        </View>
    </SafeAreaView>
  );
}