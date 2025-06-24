import React from 'react';
import { Tool } from '@/src/types/tools';
import { ToolSelector } from '@/src/components/character/ToolSelector';

interface CharacterToolSelectorProps {
  selectedToolIds: string[];
  availableTools: Tool[];
  onToolToggle: (toolId: string) => void;
}

export const CharacterToolSelectorComponent: React.FC<CharacterToolSelectorProps> = ({
  selectedToolIds,
  availableTools,
  onToolToggle,
}) => {
  return (
    <ToolSelector
      tools={availableTools}
      selectedToolIds={selectedToolIds}
      onSelectTool={onToolToggle}
      onRemoveTool={onToolToggle} // Assuming onSelectTool handles both cases or can be adapted
    />
  );
};
