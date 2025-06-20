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
import { Card } from "@/src/components/ui/Card";

interface CharactersListProps {
  characters: Character[];
  onCharacterPress?: (character: Character) => void;
  onCharacterLongPress?: (character: Character) => void;
  onAddCharacter?: () => void;
  title?: string;
  showAddButton?: boolean;
  className?: string;
  setCharacters: (characters: Character[]) => void;
  onDeleteCharacter?: (character: Character) => void;
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
  onDeleteCharacter,
}: CharactersListProps) {
  const { t, locale } = useLocalization();

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

  const renderActions = (character: Character) => (
    <>
      <TouchableOpacity 
        onPress={() => onCharacterLongPress?.(character)}
        className="p-2 bg-blue-100 rounded-lg"
      >
        <Ionicons name="play" size={16} className="!text-blue-800" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => onCharacterPress?.(character)}
        className="p-2 bg-primary/10 rounded-lg"
      >
        <Ionicons name="pencil" size={16} className="!text-primary" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => onDeleteCharacter?.(character)}
        className="p-2 bg-red-100 rounded-lg"
      >
        <Ionicons name="trash" size={16} className="!text-red-800" />
      </TouchableOpacity>
    </>
  );

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
              <Card
                key={character.id}
                icon="person"
                title={character.name}
                description={character.content}
                className="h-40"
                actions={renderActions(character)}
              >
                
              </Card>
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
