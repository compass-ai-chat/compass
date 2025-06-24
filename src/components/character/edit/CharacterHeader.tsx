import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ImagePickerButton } from '@/src/components/image/ImagePickerButton';
import { IconSelector } from '@/src/components/character/IconSelector';
import { Character } from '@/src/types/core';
import { useLocalization } from '@/src/hooks/useLocalization';

interface CharacterHeaderProps {
  character: Character | null;
  onCharacterChange: (character: Partial<Character>) => void;
  useIcon: boolean;
  onUseIconChange: (useIcon: boolean) => void;
  showIconSelector: boolean;
  onShowIconSelectorChange: (show: boolean) => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
  character,
  onCharacterChange,
  useIcon,
  onUseIconChange,
  showIconSelector,
  onShowIconSelectorChange,
}) => {
  const { t } = useLocalization();

  const handleImageSelected = (imageUri: string) => {
    onCharacterChange({ image: imageUri, icon: undefined });
    onUseIconChange(false);
  };

  const handleIconSelected = (iconName: string) => {
    onCharacterChange({ icon: iconName, image: undefined });
    onUseIconChange(true);
    onShowIconSelectorChange(false);
  };

  return (
    <View className="items-center mb-8 pt-4 border-b border-border mx-4 flex-row py-4">
      <View className="items-center justify-between border-r border-border px-4 mr-4">
        <View className="relative">
          {useIcon ? (
            <TouchableOpacity
              onPress={() => onShowIconSelectorChange(true)}
              className="w-[80px] h-[80px] rounded-full bg-primary items-center justify-center hover:opacity-80"
            >
              <Ionicons
                name={character?.icon || 'person' as any}
                size={48}
                color="white"
              />
            </TouchableOpacity>
          ) : (
            <ImagePickerButton
              currentImage={character?.image}
              onImageSelected={handleImageSelected}
            />
          )}
           <TouchableOpacity
            onPress={() => onUseIconChange(!useIcon)}
            className="absolute -bottom-2 -right-2 bg-surface p-1 rounded-full border border-border"
            style={{ elevation: 5 }} // For Android shadow
          >
            <Ionicons name={useIcon ? "image-outline" : "happy-outline"} size={20} className="text-text" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        <Text className="text-base font-medium mb-2 text-text">
          {t('characters.edit_character.name')}
        </Text>
        <TextInput
          value={character?.name || ''}
          onChangeText={(text) => onCharacterChange({ name: text })}
          placeholder={t('characters.edit_character.enter_character_name')}
          className="p-4 rounded-lg text-text border-2 border-border bg-surface outline-none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <IconSelector
        isVisible={showIconSelector}
        onClose={() => onShowIconSelectorChange(false)}
        onSelect={handleIconSelected}
        currentIcon={character?.icon}
      />
    </View>
  );
};
