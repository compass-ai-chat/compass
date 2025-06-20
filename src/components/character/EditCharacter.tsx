import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { useAtom, useSetAtom } from "jotai";
import {
  charactersAtom,
  saveCustomPrompts,
  availableModelsAtom,
  syncToPolarisAtom,
} from "@/src/hooks/atoms";
import { AllowedModel, Character, Model } from "@/src/types/core";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useEffect, useRef } from "react";
import { ImagePickerButton } from "@/src/components/image/ImagePickerButton";
import { toastService } from "@/src/services/toastService";
import { IconSelector } from "@/src/components/character/IconSelector";
import { DocumentSelector } from "./DocumentSelector";
import { ModelPreferenceSelector } from "./ModelPreferenceSelector";
import { Switch } from "@/src/components/ui/Switch";
import { Document } from "@/src/types/core";
import { useLocalization } from "@/src/hooks/useLocalization";
import { TemplateVariableSelector } from './TemplateVariableSelector';
import { modalService } from "@/src/services/modalService";
import { Tool } from "@/src/types/tools";
import { ToolSelector } from "./ToolSelector";
import { FontAwesome6 } from "@expo/vector-icons";
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
  const [cursorPosition, setCursorPosition] = useState(0);
  const contentInputRef = useRef<TextInput>(null);
  const dispatchCharacters = useSetAtom(saveCustomPrompts);
  const { t } = useLocalization();
  
  useEffect(() => {
    let chara = existingCharacter;

    setCharacter(chara as Character);
    setUseIcon(!!chara?.icon);
  }, [existingCharacter]);

  const handleDocumentToggle = (docId: string) => {
    if (character?.documentIds?.includes(docId)) {
      // Remove the document if it's already selected
      setCharacter({
        ...character!,
        documentIds: character.documentIds.filter((id) => id !== docId),
      });
    } else {
      // Add the document if it's not already selected
      setCharacter({
        ...character!,
        documentIds: [...(character?.documentIds || []), docId],
      });
    }
  };

  const handleImageSelected = (imageUri: string) => {
    setCharacter({ ...character!, image: imageUri });
  };

  const handleAllowedModelAdd = (model: AllowedModel) => {
    const currentAllowedModels = character?.allowedModels || [];

    // Check if this model already has a preference
    const existingIndex = currentAllowedModels.findIndex(
      (p) => p.id === model.id,
    );

    if (existingIndex >= 0) {
      // Update existing preference
      const updatedAllowedModelIds = [...currentAllowedModels];
      updatedAllowedModelIds[existingIndex] = model;
      setCharacter({ ...character!, allowedModels: updatedAllowedModelIds });
    } else {
      // Add new preference
      setCharacter({
        ...character!,
        allowedModels: [...currentAllowedModels, model],
      });
    }
  };

  const handleAllowedModelRemove = (model: AllowedModel) => {
    if (!character?.allowedModels) return;

    setCharacter({
      ...character,
      allowedModels: character.allowedModels.filter((p) => p.id !== model.id),
    });
  };

  const handleToolToggle = (toolId: string) => {
    if (character?.toolIds?.includes(toolId)) {
      // Remove the tool if it's already selected
      setCharacter({
        ...character!,
        toolIds: character.toolIds.filter((id) => id !== toolId),
      });
    } else {
      // Add the tool if it's not already selected
      setCharacter({
        ...character!,
        toolIds: [...(character?.toolIds || []), toolId],
      });
    }
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

  const insertTemplateVariable = (template: string) => {
    if (!character) return;
    
    const content = character.content || "";
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    
    const newContent = beforeCursor + template + afterCursor;
    setCharacter({ ...character, content: newContent });
    
    // Focus back on the input and set cursor position after the inserted template
    setTimeout(() => {
      if (contentInputRef.current) {
        contentInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <View className={`flex-1 bg-background ${className}`}>
      
        <View className="items-center mb-8 pt-4 border-b border-border mx-4 flex-row py-4">
        <View className="flex-1">
            <Text className="text-base font-medium mb-2 text-text">
              {t('characters.edit_character.name')}
            </Text>
            <TextInput
              value={character?.name || ""}
              onChangeText={(text) =>
                setCharacter({ ...character!, name: text })
              }
              placeholder={t('characters.edit_character.enter_character_name')}
              className="p-4 rounded-lg text-text border-2 border-border bg-surface outline-none"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View className="items-center justify-between mx-8 mr-16">
          <View className="relative">
            {useIcon ? (
              <TouchableOpacity
                onPress={() => setShowIconSelector(true)}
                className="w-[80px] h-[80px] rounded-full bg-primary items-center justify-center hover:opacity-80"
              >
                <Ionicons
                  name={character?.icon || ("person" as any)}
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
          </View>
          </View>
          
          
        </View>

        <IconSelector
          isVisible={showIconSelector}
          onClose={() => setShowIconSelector(false)}
          onSelect={(iconName) => {
            setCharacter({ ...character!, icon: iconName, image: undefined });
          }}
          currentIcon={character?.icon}
        />

        <ScrollView
                className="flex-1 p-4"
                contentContainerStyle={{ flexGrow: 1 }}
              >
        <View className="space-y-6 flex-1">
          

          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <FontAwesome6 name="pen-fancy" size={22} className="!text-primary mr-2" />
                <Text className="text-base font-medium text-text">
                  {t('characters.edit_character.instructions')}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowTemplateSelector(true)}
                className="bg-primary/10 px-3 py-1 rounded-lg flex-row items-center"
              >
                <Ionicons name="code-outline" size={16} color="#6366F1" className="mr-1" />
                <Text className="text-primary text-sm font-medium">
                  Insert Variable
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-1 mb-2">
            <TextInput
              ref={contentInputRef}
              value={character?.content || ""}
              onChangeText={(text) =>
                setCharacter({ ...character!, content: text })
              }
              onSelectionChange={(e) => {
                setCursorPosition(e.nativeEvent.selection.start);
              }}
              placeholder={t('characters.edit_character.enter_character_prompt')}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-surface p-4 rounded-lg text-text border-2 border-border flex-1 outline-none"
              placeholderTextColor="#9CA3AF"
            />
            {showTemplateSelector && (
              <TemplateVariableSelector
                isVisible={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelectVariable={insertTemplateVariable}
              />
            )}
            </View>
          </View>

          <View>
            <ModelPreferenceSelector
              availableModels={availableModels}
              selectedPreferences={character?.allowedModels || []}
              onAddPreference={handleAllowedModelAdd}
              onRemovePreference={handleAllowedModelRemove}
            />
            {showCharacterExposeAsModel && (
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-medium mb-2 text-text">
                  {t('characters.edit_character.expose_as_model')}
                </Text>
                <Switch
                  className="mx-auto"
                  value={character?.exposeAsModel ?? false}
                  onValueChange={(value) =>
                    setCharacter({ ...character!, exposeAsModel: value })
                  }
                />
              </View>
            )}
          </View>

          <DocumentSelector
            documents={availableDocuments}
            selectedDocIds={character?.documentIds || []}
            onSelectDoc={handleDocumentToggle}
            onRemoveDoc={handleDocumentToggle}
            className="mb-2"
          />

          <ToolSelector
            tools={availableTools}
            selectedToolIds={character?.toolIds || []}
            onSelectTool={handleToolToggle}
            onRemoveTool={handleToolToggle}
          />
        </View>
      </ScrollView>

      

      <View className="p-4 border-t border-border flex-row justify-between">
        <TouchableOpacity
          onPress={() => deleteCharacter()}
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
        <TouchableOpacity
          onPress={saveCharacter}
          className="bg-primary p-4 rounded-lg flex-row items-center justify-center flex-1 hover:opacity-80"
        >
          <Ionicons
            name="save-outline"
            size={20}
            color="white"
            className="mr-2"
          />
          <Text className="text-white font-medium text-base">
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
