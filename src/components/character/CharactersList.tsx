import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Character } from "@/src/types/core";
import { CharacterAvatar } from "@/src/components/character/CharacterAvatar";
import { useLocalization } from "@/src/hooks/useLocalization";
import { PREDEFINED_PROMPTS_BY_LOCALE } from "@/constants/characters";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Card } from "@/src/components/ui/Card";
import { useResponsiveStyles } from "@/src/hooks/useResponsiveStyles";
import { IconSelector } from "./IconSelector";

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
  selectedCharacter?: Character;
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
  selectedCharacter,
}: CharactersListProps) {
  const { t, locale } = useLocalization();
  const [search, setSearch] = useState("");
  const { getResponsiveSize, getResponsiveClass, getResponsiveValue } = useResponsiveStyles();

  const filteredCharacters = useMemo(() => {
    return characters.filter(character => character.name.toLowerCase().includes(search.toLowerCase()));
  }, [characters, search]);

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
      
      {/* <TouchableOpacity 
        onPress={() => onCharacterPress?.(character)}
        className="p-2 bg-primary/10 rounded-lg"
      >
        <Ionicons name="pencil" size={16} className="!text-primary" />
      </TouchableOpacity> */}
      
      <TouchableOpacity 
        onPress={() => onDeleteCharacter?.(character)}
        className="p-2 bg-red-100 rounded-lg"
      >
        <Ionicons name="trash" size={16} className="!text-red-800" />
      </TouchableOpacity>
    </>
  );

  return (
    <View className={`bg-background ${className}`}>
      <SectionHeader
        title={t('characters.characters')}
        icon="people"
        //rightContent={rightContent}
      />

      {/* Search */}
      <View className="bg-surface rounded-lg flex-row items-center mb-2 p-2">
          <Ionicons
            name="search"
            size={getResponsiveSize(16, 20)}
            className="!text-secondary mr-2"
          />
          <TextInput
            className={`flex-1 text-text outline-none ${getResponsiveClass("text-sm", "")}`}
            placeholder="Search characters..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={getResponsiveSize(16, 20)}
                className="!text-secondary"
              />
            </TouchableOpacity>
          )}
        </View>
      
      {true && (
        <ScrollView className="flex-1 p-2">
            {filteredCharacters.map((character) => (
              <TouchableOpacity onPress={() => onCharacterPress?.(character)} key={character.id} className={`mb-2 h-20 overflow-hidden flex-row items-center border border-border rounded-lg p-2 ${selectedCharacter?.id === character.id ? "border-2 border-primary" : ""}`}>
                <View className="flex-row items-center">
                    <View className="h-10 w-10 bg-primary rounded-full items-center justify-center">
                      <Ionicons 
                        name={character.icon as any} 
                        size={20} 
                        className={`!text-white`} 
                      />
                    </View>
                    <View className="flex-1 ml-2">
                      <Text
                        className={`text-lg font-semibold !text-primary`}
                      >
                        {character.name}
                      </Text>
                      {character.content && (
                        <Text
                          className={`text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap`}
                        >
                          {character.content}
                        </Text>
                      )}
                    </View>
                </View>
              </TouchableOpacity>
            ))}
            <View className="justify-center items-center">
          {showAddButton && onAddCharacter && (
            <TouchableOpacity
              onPress={onAddCharacter}
              className={`border-2 border-border px-4 py-4 rounded-lg flex-row items-center hover:opacity-80 h-20 w-full ${getResponsiveClass("h-10", "h-20")} ${selectedCharacter && !selectedCharacter.id ? "border-2 border-primary" : "border-dashed"}`}
            >
              <Ionicons name="add" size={20} className="!text-gray-500" />
              <Text className="text-gray-500 ml-2 font-medium">{t('characters.new_character')}</Text>
            </TouchableOpacity>
          )}
          {characters.length === 0 && (
            <Text className="text-gray-500 mt-4">{t('characters.no_characters')}</Text>
          )}
        </View>
        </ScrollView>
      )}
        
    </View>
  );
}
