import { View, Platform } from 'react-native';
import { ChatThread } from '@/src/components/chat/ChatThread';
import { ChatThreads } from '@/src/components/chat/ChatThreads';
import { useWindowDimensions, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useThemePreset } from '@/src/components/ui/ThemeProvider';

const MIN_DESKTOP_WIDTH = 768;

export default function HomeScreen() {
  
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= MIN_DESKTOP_WIDTH;
  const router = useRouter();
  const { theme } = useThemePreset();


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
        <Ionicons name="compass" size={36} color={theme.primary} />
        <Text className="ms-2 text-2xl font-bold text-primary">Compass</Text>
      </View>
      <ChatThreads />
    </View>
  );
}
