import { useLocalSearchParams } from 'expo-router';
import { ChatThread } from '@/src/components/chat/ChatThread';
import { View } from 'react-native';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Only redirect if no id on initial mount
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