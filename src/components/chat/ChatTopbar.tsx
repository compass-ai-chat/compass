import { View, Text, TouchableOpacity } from 'react-native';
import { Settings } from './Settings';
import { ModelSelector } from './ModelSelector';
import { VoiceSelector } from './VoiceSelector';
import { useAtom, useSetAtom } from 'jotai';
import { currentThreadAtom, defaultVoiceAtom, polarisUserAtom, threadActionsAtom, ttsEnabledAtom } from '@/src/hooks/atoms';
import { Character, Model } from '@/src/types/core';
import { useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import Tooltip from '../ui/Tooltip';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalization } from '@/src/hooks/useLocalization';


export const ChatTopbar: React.FC = () => {
    const [currentThread, setCurrentThread] = useAtom(currentThreadAtom);
    const [polarisUser] = useAtom(polarisUserAtom);
    const [ttsEnabled, setTtsEnabled] = useAtom(ttsEnabledAtom);
    const dispatchThread = useSetAtom(threadActionsAtom);
    const [selectedVoice, setSelectedVoice] = useAtom(defaultVoiceAtom);
    const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { t } = useLocalization();



    const toggleDark = useCallback(() => {
      toggleColorScheme();
    }, [toggleColorScheme]);



    const handleSelectModel = (model: Model | undefined) => {
        dispatchThread({
          type: 'update',
          payload: { ...currentThread, selectedModel: model }
        });
      };
    
      const handleSelectCharacter = (character: Character) => {
        dispatchThread({
          type: 'update',
          payload: { ...currentThread, character: character }
        });
      };


    return (
        <View className="absolute top-0 left-0 right-0 w-[25%] mx-auto p-2 flex-row justify-between items-center border-b border-border bg-surface shadow-2xl rounded-xl mt-2 z-10 opacity-60 hover:opacity-100 transition-all duration-200">
        <ModelSelector 
            onModelSelect={handleSelectModel}
            onCharacterSelect={handleSelectCharacter}
            thread={currentThread}
            character={currentThread.character}
            className=''
            />
        <View className="flex-row items-center gap-2">
        {polarisUser && (
            <View className="flex-row items-center gap-2">
            <Text className="text-sm text-text">{polarisUser.firstName}</Text>
            </View>
        )}
        
          <TouchableOpacity 
            onPress={toggleDark}
            className="p-2 rounded-full bg-surface hover:bg-background"
          >
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={24}
              className="!text-text"
            />
          </TouchableOpacity>
            <Settings thread={currentThread}></Settings>
        
        
        {ttsEnabled && (
            <VoiceSelector
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            />
        )}
        </View>
        
    </View>
    )
}; 