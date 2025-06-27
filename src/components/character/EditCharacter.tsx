import { View } from "react-native";
import { Character, Model, Document } from "@/src/types/core";
import { useState, useEffect } from "react";
import { toastService } from "@/src/services/toastService";
import { IconSelector } from "@/src/components/character/IconSelector";
import { modalService } from "@/src/services/modalService";
import { useLocalization } from "@/src/hooks/useLocalization";
import { CharacterHeader } from "./CharacterHeader";
import { CharacterForm } from "./CharacterForm";
import { CharacterFooter } from "./CharacterFooter";
import { Tool } from "@/src/types/tools";

interface EditCharacterProps {
  availableModels: Model[];
  availableDocuments: Document[];
  availableTools: Tool[];
  existingCharacter: Character;
  onSave: (character: Character) => void;
  onDelete: (character: Character) => void;
  className?: string;
  showCharacterExposeAsModel?: boolean;
}

export default function EditCharacter({
  existingCharacter,
  onSave,
  onDelete,
  className,
  availableModels,
  availableDocuments,
  availableTools,
  showCharacterExposeAsModel = false,
}: EditCharacterProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [useIcon, setUseIcon] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { t } = useLocalization();
  
  useEffect(() => {
    let chara = existingCharacter;
    setCharacter(chara as Character);
    setUseIcon(!!chara?.icon);
  }, [existingCharacter]);

  const handleImageSelected = (imageUri: string) => {
    setCharacter({ ...character!, image: imageUri });
  };

  const saveCharacter = async () => {
    if (!character?.name.trim()) return;

    try {
      onSave(character);
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
  };

  const deleteCharacter = async () => {
    const confirmed = await modalService.confirm({
      title: t('common.confirm_delete'),
      message: t('common.confirm_delete_message', { name: character?.name || '' }),
    });

    if (!confirmed) return;

    try {
      onDelete(character as Character);
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

  return (
    <View className={`flex-1 bg-background ${className}`}>
      <CharacterHeader
        character={character}
        useIcon={useIcon}
        onCharacterChange={setCharacter}
        onImageSelected={handleImageSelected}
        onShowIconSelector={() => setShowIconSelector(true)}
      />

      <IconSelector
        isVisible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(iconName) => {
          setCharacter({ ...character!, icon: iconName, image: undefined });
        }}
        currentIcon={character?.icon}
        modalClassName="w-3/4"
      />

      <CharacterForm
        character={character}
        availableModels={availableModels}
        availableDocuments={availableDocuments}
        availableTools={availableTools}
        showCharacterExposeAsModel={showCharacterExposeAsModel}
        onCharacterChange={setCharacter}
      />

      <CharacterFooter
        character={character}
        onSave={saveCharacter}
        onDelete={deleteCharacter}
      />
    </View>
  );
}
