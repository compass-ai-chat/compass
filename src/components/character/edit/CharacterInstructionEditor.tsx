import React from 'react';
import { View } from 'react-native';
import { Character } from '@/src/types/core';
import { InstructionEditor } from '@/src/components/character/InstructionEditor';
// import { TemplateVariableSelector } from '@/src/components/character/TemplateVariableSelector'; // If needed later

interface CharacterInstructionEditorProps {
  character: Character | null;
  onContentChange: (content: string) => void;
  // onShowTemplateSelectorChange: (show: boolean) => void; // If needed later
  // showTemplateSelector: boolean; // If needed later
  // onInsertVariable: (variable: string) => void; // If needed later
}

export const CharacterInstructionEditorComponent: React.FC<CharacterInstructionEditorProps> = ({
  character,
  onContentChange,
  // onShowTemplateSelectorChange,
  // showTemplateSelector,
  // onInsertVariable,
}) => {
  if (!character) return null;

  return (
    <View className="flex-1">
      <View className="flex-row flex-1 mb-2">
        <InstructionEditor
          character={character}
          content={character.content || ""}
          onChangeText={onContentChange}
          onInsertVariable={() => { /* onShowTemplateSelectorChange(true) */ }} // Placeholder for now
        />
        {/* {showTemplateSelector && ( // If needed later
          <TemplateVariableSelector
            isVisible={showTemplateSelector}
            onClose={() => onShowTemplateSelectorChange(false)}
            onSelectVariable={onInsertVariable}
          />
        )} */}
      </View>
    </View>
  );
};
