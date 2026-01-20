import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Character } from '@/src/types/core';
import { useAtomValue } from 'jotai';
import { currentThreadLoadableAtom, defaultThreadAtom } from '@/src/hooks/atoms';

interface CharacterMentionPopupProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  searchText: string;
  selectedIndex: number;
}

export const CharacterMentionPopup: React.FC<CharacterMentionPopupProps> = ({
  characters,
  onSelect,
  searchText,
  selectedIndex
}) => {
  const currentThreadLoadable = useAtomValue(currentThreadLoadableAtom);
  const defaultThread = useAtomValue(defaultThreadAtom);
  const currentThread = currentThreadLoadable.state === 'hasData' 
    ? currentThreadLoadable.data 
    : defaultThread;

  const filteredCharacters = characters.filter(char => 
    char.name.toLowerCase().includes(searchText.toLowerCase()) && 
    char.id !== currentThread.character.id
  );

  if (filteredCharacters.length === 0) return null;

  return (
    <View className="absolute bottom-full left-0 mb-2 bg-background rounded-lg shadow-lg max-h-40 w-64 overflow-hidden">
      <ScrollView>
        {filteredCharacters.map((character, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={character.id}
              onPress={() => onSelect(character)}
              className={`flex-row items-center p-2 border-b border-gray-200 dark:border-gray-700 
                ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            >
              {/* <Image 
                source={character.image} 
                className="w-8 h-8 rounded-full mr-2"
              /> */}
              <View className="flex-1">
                <Text className={`font-medium text-gray-800 dark:text-gray-200 
                  ${isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {character.name}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                  {character.content.slice(0, 50)}...
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}; 