import React from 'react';
import { Document } from '@/src/types/core';
import { DocumentSelector } from '@/src/components/character/DocumentSelector';

interface CharacterDocumentSelectorProps {
  selectedDocIds: string[];
  availableDocuments: Document[];
  onDocumentToggle: (docId: string) => void;
  className?: string;
}

export const CharacterDocumentSelectorComponent: React.FC<CharacterDocumentSelectorProps> = ({
  selectedDocIds,
  availableDocuments,
  onDocumentToggle,
  className,
}) => {
  return (
    <DocumentSelector
      documents={availableDocuments}
      selectedDocIds={selectedDocIds}
      onSelectDoc={onDocumentToggle}
      onRemoveDoc={onDocumentToggle} // Assuming onSelectDoc handles both cases or can be adapted
      className={className}
    />
  );
};
