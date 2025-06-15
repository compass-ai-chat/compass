import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Settings } from './Settings';
import { VoiceSelector } from './VoiceSelector';
import { useAtom, useSetAtom } from 'jotai';
import { currentThreadAtom, defaultVoiceAtom, polarisUserAtom, threadActionsAtom, ttsEnabledAtom, downloadingModelsAtom } from '@/src/hooks/atoms';
import { useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalization } from '@/src/hooks/useLocalization';
import { Dropdown, DropdownElement } from '../ui/Dropdown';

interface ChatTopbarProps {
  dropdownElements: DropdownElement[];
  selectedElement?: DropdownElement;
  onSelection: (element: DropdownElement) => void;
}

export const ChatTopbar: React.FC<ChatTopbarProps> = ({ dropdownElements, selectedElement, onSelection }) => {
    const [currentThread, setCurrentThread] = useAtom(currentThreadAtom);
    const [polarisUser] = useAtom(polarisUserAtom);
    const [ttsEnabled, setTtsEnabled] = useAtom(ttsEnabledAtom);
    const dispatchThread = useSetAtom(threadActionsAtom);
    const [selectedVoice, setSelectedVoice] = useAtom(defaultVoiceAtom);
    const [downloadingModels] = useAtom(downloadingModelsAtom);
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const { t } = useLocalization();

    const toggleDark = useCallback(() => {
      toggleColorScheme();
    }, [toggleColorScheme]);

    return (
        <View className="absolute top-0 left-0 right-0 min-w-[25%] w-fit mx-auto p-2 flex-row justify-between items-center border-b border-border bg-surface shadow-2xl rounded-xl mt-2 z-10 opacity-60 hover:opacity-100 transition-all duration-200">
        <Dropdown 
          openUpwards={false}
          showSearch={true}
          selected={selectedElement}
          onSelect={onSelection}
          children={dropdownElements}
          className={`w-48 overflow-hidden bg-surface`}
          dropdownOptionClassName="w-64"
          position="left"
        />
        {/* <ModelSelector 
            onModelSelect={handleSelectModel}
            onCharacterSelect={handleSelectCharacter}
            thread={currentThread}
            character={currentThread.character}
            className=''
            /> */}
        <View className="flex-row items-center gap-2">
        {polarisUser && (
            <View className="flex-row items-center gap-2">
            <Text className="text-sm text-text">{polarisUser.firstName}</Text>
            </View>
        )}
        
        {downloadingModels.length > 0 && (
          <View className="flex-row items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
            <ActivityIndicator size="small" className="text-primary" />
            <Text className="text-sm text-primary">
              {downloadingModels.length} model{downloadingModels.length > 1 ? 's' : ''} downloading
            </Text>
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