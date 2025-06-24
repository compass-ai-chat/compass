import { View, Text, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { AllowedModel, Character, Model, Document } from "@/src/types/core";
import { Tool } from "@/src/types/tools";
import { Platform } from "@/src/utils/platform";
import { useLocalization } from "@/src/hooks/useLocalization";

import { CharacterHeader } from "./edit/CharacterHeader";
import { CharacterInstructionEditorComponent } from "./edit/CharacterInstructionEditor";
import { CharacterModelSelectorComponent } from "./edit/CharacterModelSelector";
import { CharacterDocumentSelectorComponent } from "./edit/CharacterDocumentSelector";
import { CharacterToolSelectorComponent } from "./edit/CharacterToolSelector";
import { CharacterActions } from "./edit/CharacterActions";

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
  // const [showTemplateSelector, setShowTemplateSelector] = useState(false); // Keep if needed for InstructionEditor
  // const [cursorPosition, setCursorPosition] = useState(0); // Keep if needed for InstructionEditor
  // const contentInputRef = useRef<TextInput>(null); // Keep if needed for InstructionEditor
  const { t } = useLocalization();

  useEffect(() => {
    setCharacter(existingCharacter as Character);
    setUseIcon(!!existingCharacter?.icon);
  }, [existingCharacter]);

  const handleCharacterChange = (updatedFields: Partial<Character>) => {
    setCharacter((prev) => ({ ...prev!, ...updatedFields }));
  };

  const handleDocumentToggle = (docId: string) => {
    setCharacter((prev) => {
      if (!prev) return null;
      const currentDocIds = prev.documentIds || [];
      if (currentDocIds.includes(docId)) {
        return {
          ...prev,
          documentIds: currentDocIds.filter((id) => id !== docId),
        };
      } else {
        return { ...prev, documentIds: [...currentDocIds, docId] };
      }
    });
  };

  const handleAllowedModelAdd = (model: AllowedModel) => {
    setCharacter((prev) => {
      if (!prev) return null;
      const currentAllowedModels = prev.allowedModels || [];
      const existingIndex = currentAllowedModels.findIndex((p) => p.id === model.id);
      if (existingIndex >= 0) {
        const updatedAllowedModels = [...currentAllowedModels];
        updatedAllowedModels[existingIndex] = model;
        return { ...prev, allowedModels: updatedAllowedModels };
      } else {
        return { ...prev, allowedModels: [...currentAllowedModels, model] };
      }
    });
  };

  const handleAllowedModelRemove = (model: AllowedModel) => {
    setCharacter((prev) => {
      if (!prev || !prev.allowedModels) return null;
      return {
        ...prev,
        allowedModels: prev.allowedModels.filter((p) => p.id !== model.id),
      };
    });
  };

  const handleToolToggle = (toolId: string) => {
    setCharacter((prev) => {
      if (!prev) return null;
      const currentToolIds = prev.toolIds || [];
      if (currentToolIds.includes(toolId)) {
        return { ...prev, toolIds: currentToolIds.filter((id) => id !== toolId) };
      } else {
        return { ...prev, toolIds: [...currentToolIds, toolId] };
      }
    });
  };

  // const insertTemplateVariable = (template: string) => { // Keep if needed for InstructionEditor
  //   if (!character) return;
  //   const content = character.content || "";
  //   const beforeCursor = content.substring(0, cursorPosition);
  //   const afterCursor = content.substring(cursorPosition);
  //   const newContent = beforeCursor + template + afterCursor;
  //   handleCharacterChange({ content: newContent });
  //   setTimeout(() => {
  //     if (contentInputRef.current) {
  //       contentInputRef.current.focus();
  //     }
  //   }, 100);
  // };

  const handleSave = () => {
    if (character) {
      onSave(character);
    }
  };

  const handleDelete = () => {
    if (character) {
      onDelete(character);
    }
  };

  return (
    <View className={`flex-1 bg-background ${className}`}>
      {!Platform.isMobile && (
        <Text className="text-text text-sm mb-4 pl-2 border-l-4 border-border">
          A Character shapes your AI assistant's communication style and
          available resources. By defining specific traits, tools and documents,
          you can transform generic responses into meaningful interactions
          tailored to your needs - whether you're seeking a creative writing
          partner, technical expert, or thoughtful mentor.
        </Text>
      )}

      <CharacterHeader
        character={character}
        onCharacterChange={handleCharacterChange}
        useIcon={useIcon}
        onUseIconChange={setUseIcon}
        showIconSelector={showIconSelector}
        onShowIconSelectorChange={setShowIconSelector}
      />

      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="space-y-6 flex-1">
          <CharacterInstructionEditorComponent
            character={character}
            onContentChange={(content) => handleCharacterChange({ content })}
            // onShowTemplateSelectorChange={setShowTemplateSelector} // Pass if needed
            // showTemplateSelector={showTemplateSelector} // Pass if needed
            // onInsertVariable={insertTemplateVariable} // Pass if needed
          />

          <CharacterModelSelectorComponent
            character={character}
            availableModels={availableModels}
            onAllowedModelAdd={handleAllowedModelAdd}
            onAllowedModelRemove={handleAllowedModelRemove}
            onExposeAsModelChange={(exposeAsModel) => handleCharacterChange({ exposeAsModel })}
            showCharacterExposeAsModel={showCharacterExposeAsModel}
          />

          <CharacterDocumentSelectorComponent
            availableDocuments={availableDocuments}
            selectedDocIds={character?.documentIds || []}
            onDocumentToggle={handleDocumentToggle}
            className="mb-2"
          />

          <CharacterToolSelectorComponent
            availableTools={availableTools}
            selectedToolIds={character?.toolIds || []}
            onToolToggle={handleToolToggle}
          />
        </View>
      </ScrollView>

      <CharacterActions
        character={character}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaveDisabled={!character?.name?.trim()}
      />
    </View>
  );
}
