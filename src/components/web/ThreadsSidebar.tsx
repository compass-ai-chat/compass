import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { ChatThreads } from '@/src/components/chat/ChatThreads';
import { useAtomValue, useSetAtom } from 'jotai';
import { defaultThreadAtom, threadActionsAtom } from '@/src/hooks/atoms';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalization } from '@/src/hooks/useLocalization';
import Tooltip from '../ui/Tooltip';
import { router } from 'expo-router';
import { useState } from 'react';
import { useCharacterModelSelection } from '@/src/hooks/useCharacterModelSelection';

export const ThreadsSidebar = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { t } = useLocalization();
  const dispatchThread = useSetAtom(threadActionsAtom);
  const defaultThread = useAtomValue(defaultThreadAtom);
  const { selectedModel, selectedCharacter } = useCharacterModelSelection();

  
  const addNewThread = async () => {
    console.log("selected model", selectedModel);
    const newThread = {
      ...defaultThread, 
      id: Date.now().toString(),
      character: selectedCharacter,
      selectedModel: selectedModel
    };
    
    dispatchThread({ type: 'add', payload: newThread });
    
    if(Platform.OS != 'web' || window.innerWidth < 768){
    // wait 100 ms before pushing to allow for thread to be added to state
      setTimeout(() => {
        router.push(`/thread/${newThread.id}`);
      }, 100);
    }
  };

  // Common sidebar classes
  const sidebarWidthClass = isSidebarVisible ? 'w-64 h-[70%] shadow-lg' : 'w-10';
  
  return (
    <View className='absolute left-0 my-auto z-[1] flex flex-col top-20'>
      <View 
        className={`h-32 bg-surface border-r-2 border-border rounded-lg group transition-all duration-200 ${sidebarWidthClass}`}
        onMouseEnter={() => setIsSidebarVisible(true)}
        onMouseLeave={() => setIsSidebarVisible(false)}
      >
          {isSidebarVisible ? (
            <View className="p-1">
              <View className="flex-row justify-between items-center p-4">
                <Text className="text-center text-lg font-bold text-text">
                  {t('chats.chats')}
                </Text>
              </View>
              <ChatThreads />
            </View>
          ) : (
            <View className="flex items-center justify-center my-auto h-32">
              <Ionicons name="chatbubbles" size={24} className="!text-primary" />
            </View>
          )}
      </View>
      
      {!isSidebarVisible && (
        <Tooltip text={t('chats.new_chat') + '\n(Alt + N)'} tooltipClassName="w-20">
          <TouchableOpacity 
            onPress={addNewThread} 
            className="mt-4 justify-between items-center"
          >
            <Ionicons 
              className="!text-primary" 
              name="add" 
              size={24}
            />
          </TouchableOpacity>
        </Tooltip>
      )}
    </View>
  );
}; 