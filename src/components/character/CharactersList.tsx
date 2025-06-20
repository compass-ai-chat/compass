import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Character } from "@/src/types/core";
import { CharacterAvatar } from "@/src/components/character/CharacterAvatar";
import { useLocalization } from "@/src/hooks/useLocalization";
import { PREDEFINED_PROMPTS_BY_LOCALE } from "@/constants/characters";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useResponsiveStyles } from "@/src/hooks/useResponsiveStyles";
import { TouchableOpacity as GestureTouchableOpacity } from "react-native-gesture-handler";

interface CharactersListProps {
  characters: Character[];
  onCharacterPress?: (character: Character) => void;
  onCharacterLongPress?: (character: Character) => void;
  onAddCharacter?: () => void;
  title?: string;
  showAddButton?: boolean;
  className?: string;
  setCharacters: (characters: Character[]) => void;
}

export default function CharactersList({
  characters,
  onCharacterPress,
  onCharacterLongPress,
  onAddCharacter,
  title = "Characters",
  showAddButton = true,
  className = "",
  setCharacters,
}: CharactersListProps) {
  const { t, locale } = useLocalization();
  const { getResponsiveClass } = useResponsiveStyles();

  const rightContent = showAddButton && onAddCharacter && characters.length > 0 ? (
    <>
      <TouchableOpacity
        onPress={() => {
          const defaultCharacters = PREDEFINED_PROMPTS_BY_LOCALE[locale];
          setCharacters(defaultCharacters);
        }}
        className="bg-surface px-4 py-2 rounded-lg flex-row items-center hover:opacity-80 mr-2"
      >
        <Ionicons name="refresh" size={20} className="!text-primary" />
        <Text className="text-primary ml-2 font-medium">{t('characters.reset_to_default')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onAddCharacter}
        className="bg-primary px-4 py-2 rounded-lg flex-row items-center hover:opacity-80"
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="text-white ml-2 font-medium">{t('characters.new_character')}</Text>
      </TouchableOpacity>
    </>
  ) : null;

  return (
    <View className={`flex-1 bg-background ${className}`}>
      <SectionHeader
        title={t('characters.characters')}
        icon="people"
        rightContent={rightContent}
      />
      
      {characters.length > 0 && (
        <ScrollView className="flex-1 p-4">
          <View className="md:gap-4 gap-2 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <GestureTouchableOpacity
                onPress={() => onCharacterPress?.(character)}
                onLongPress={() => onCharacterLongPress?.(character)}
                key={character.id}
                className="w-full mb-4"
              >
                <View
                  className="h-40 flex-row bg-surface hover:bg-background rounded-xl p-4 border border-gray-200 shadow-lg"
                  pointerEvents="auto"
                >
                  <View className="flex-col items-center my-2 mx-auto">
                    <CharacterAvatar
                      character={character}
                      size={64}
                      className="my-auto shadow-2xl"
                    />
                    <Text className="font-extrabold text-primary">
                      {character.name}
                    </Text>
                  </View>
                  {character.content?.length > 0 && (
                    <View className="flex-1 ml-4">
                      <Text
                        numberOfLines={20}
                        className="text-sm text-gray-500 dark:text-gray-400 mt-1 border border-gray-300 rounded-lg p-2 overflow-y-auto"
                      >
                        {character.content}
                      </Text>
                    </View>
                  )}
                </View>
              </GestureTouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      {characters.length === 0 && (
        <View className="flex-1 justify-center items-center">
          {showAddButton && onAddCharacter && (
            <TouchableOpacity
              onPress={onAddCharacter}
              className="bg-primary px-4 py-4 rounded-lg flex-row items-center hover:opacity-80"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white ml-2 font-medium">{t('characters.new_character')}</Text>
            </TouchableOpacity>
          )}
          <Text className="text-gray-500 mt-4">{t('characters.no_characters')}</Text>
        </View>
      )}
    </View>
  );
}
