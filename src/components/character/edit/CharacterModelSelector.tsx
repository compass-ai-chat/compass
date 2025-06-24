import React from 'react';
import { View, Text } from 'react-native';
import { Character, Model, AllowedModel } from '@/src/types/core';
import { ModelPreferenceSelector } from '@/src/components/character/ModelPreferenceSelector';
import { Switch } from '@/src/components/ui/Switch';
import { useLocalization } from '@/src/hooks/useLocalization';

interface CharacterModelSelectorProps {
  character: Character | null;
  availableModels: Model[];
  onAllowedModelAdd: (model: AllowedModel) => void;
  onAllowedModelRemove: (model: AllowedModel) => void;
  onExposeAsModelChange: (expose: boolean) => void;
  showCharacterExposeAsModel?: boolean;
}

export const CharacterModelSelectorComponent: React.FC<CharacterModelSelectorProps> = ({
  character,
  availableModels,
  onAllowedModelAdd,
  onAllowedModelRemove,
  onExposeAsModelChange,
  showCharacterExposeAsModel = false,
}) => {
  const { t } = useLocalization();

  if (!character) return null;

  return (
    <View>
      <ModelPreferenceSelector
        availableModels={availableModels}
        selectedPreferences={character.allowedModels || []}
        onAddPreference={onAllowedModelAdd}
        onRemovePreference={onAllowedModelRemove}
      />
      {showCharacterExposeAsModel && (
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-base font-medium text-text">
            {t('characters.edit_character.expose_as_model')}
          </Text>
          <Switch
            value={character.exposeAsModel ?? false}
            onValueChange={onExposeAsModelChange}
          />
        </View>
      )}
    </View>
  );
};
