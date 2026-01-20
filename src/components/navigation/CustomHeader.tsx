import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomHeader() {
  const router = useRouter();
  const segments = useSegments();
  const canGoBack = router.canGoBack();
  const { top } = useSafeAreaInsets();

  let filteredSegments = segments.filter(Boolean);
  if(filteredSegments.length > 1) {
    filteredSegments = [filteredSegments[filteredSegments.length - 2]];
  }


  const Title = () => (
      <View className="flex-row items-center">
        {filteredSegments.map((segment, index) => (
          <View key={segment} className="flex-row items-center">
            {index > 0 && (
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                className="!text-secondary mx-1" 
              />
            )}
            <Text className="text-primary capitalize font-semibold pt-1 text-lg">
              {segment.replace('-', ' ')}
            </Text>
          </View>
        ))}
      </View>
  );

  return (
    <SafeAreaView className="flex-row items-center px-4 py-3 bg-background">
      <View className='bg-surface w-full web:mt-2 rounded-lg'>
      <TouchableOpacity className="flex-row items-center h-12 hover:opacity-80 rounded-lg px-2" onPress={() => router.back()}>
        {canGoBack && (
          <View className="mr-3">
            <Ionicons name="chevron-back" size={24} className="!text-primary" />
          </View>
        )}
        
        <Title />
      </TouchableOpacity>
      
      {/* Add any right-side buttons here */}
      {/* Example:
      <TouchableOpacity className="ml-auto">
        <Ionicons name="settings-outline" size={24} className="!text-primary" />
      </TouchableOpacity>
      */}
      </View>
    </SafeAreaView>
  );
} 