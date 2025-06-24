import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Character } from '@/src/types/core';
import { useLocalization } from '@/src/hooks/useLocalization';
import { modalService } from '@/src/services/modalService';
import { toastService } from '@/src/services/toastService';

interface CharacterActionsProps {
  character: Character | null;
  onSave: () => void;
  onDelete: () => void;
  isSaveDisabled?: boolean;
}

export const CharacterActions: React.FC<CharacterActionsProps> = ({
  character,
  onSave,
  onDelete,
  isSaveDisabled = false,
}) => {
  const { t } = useLocalization();

  const handleDeleteCharacter = async () => {
    if (!character) return;

    const confirmed = await modalService.confirm({
      title: t('common.confirm_delete'),
      message: t('common.confirm_delete_message', { name: character?.name || '' }),
    });

    if (!confirmed) return;

    try {
      onDelete();
      toastService.success({
        title: t('characters.edit_character.character_deleted'),
        description: t('characters.edit_character.character_deleted_success'),
      });
    } catch (error) {
      console.error("Error deleting character:", error);
      toastService.danger({
        title: t('characters.edit_character.error_deleting_character'),
        description: t('characters.edit_character.error_deleting_character_description'),
      });
    }
  };

  const handleSaveCharacter = () => {
    if (isSaveDisabled || !character?.name?.trim()) {
        toastService.danger({
            title: t('characters.edit_character.error_saving_character'),
            description: t('characters.edit_character.name_required'),
        });
        return;
    }
    try {
        onSave();
        toastService.success({
            title: t('characters.edit_character.character_saved'),
            description: t('characters.edit_character.character_saved_success'),
        });
    } catch (error) {
        console.error("Error saving character:", error);
        toastService.danger({
            title: t('characters.edit_character.error_saving_character'),
            description: t('characters.edit_character.error_saving_character'),
        });
    }
  }

  return (
    <View className="p-4 border-t border-border flex-row justify-between">
      {character?.id && (
        <TouchableOpacity
          onPress={handleDeleteCharacter}
          className="border-2 border-red-100 dark:border-red-900 p-4 rounded-lg flex-row items-center justify-center flex-1 mr-2 hover:opacity-80"
        >
          <Ionicons
            name="trash-outline"
            size={20}
            className="mr-2 !text-red-500 dark:!text-red-300"
          />
          <Text className="!text-red-500 dark:!text-red-300 font-medium">
            {t('common.delete')}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={handleSaveCharacter}
        disabled={isSaveDisabled}
        className={`p-4 rounded-lg flex-row items-center justify-center flex-1 hover:opacity-80 ${isSaveDisabled ? 'bg-muted' : 'bg-primary'}`}
      >
        <Ionicons
          name="save-outline"
          size={20}
          color="white"
          className="mr-2"
        />
        <Text className="text-white font-medium text-base">
          {character?.id ? t('common.save') : t('common.create')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
