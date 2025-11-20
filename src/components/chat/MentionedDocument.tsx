import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { Document } from '@/src/types/core';
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { userDocumentsAtom } from "@/src/hooks/atoms";
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';
import { useResponsiveStyles } from '@/src/hooks/useResponsiveStyles';

interface MentionedDocumentProps {
  documentId: string;
  showPreviewIcon?: boolean;
}

export const MentionedDocument: React.FC<MentionedDocumentProps> = ({
  documentId,
  showPreviewIcon = true,
}) => {
  const [userDocuments] = useAtom(userDocumentsAtom);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const { getResponsiveSize } = useResponsiveStyles();
  
  const document = userDocuments.find(d => d.id === documentId);

  if (!document) {
    return (
      <View className="flex flex-row mb-2 items-center bg-red-50 border border-red-200 rounded-lg p-2 mr-2">
        <Ionicons name="alert-circle-outline" size={16} className="text-red-500! mr-2" />
        <Text className="text-red-600 text-sm">Document not found</Text>
      </View>
    );
  }

  const handlePress = () => {
    setIsPreviewVisible(true);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'document';
      case 'note':
        return 'create-outline';
      default:
        return 'document-text-outline';
    }
  };

  return (
    <>
      <TouchableOpacity 
        className="flex flex-row mb-2 items-center bg-surface border border-border rounded-lg p-2 mr-2 hover:opacity-60 hover:border-primary/50 hover:shadow-sm active:scale-95 transition-all duration-200"
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Preview document: ${document.name}`}
        accessibilityHint="Tap to open document preview"
      >
        <Ionicons 
          name={getDocumentIcon(document.type)} 
          size={getResponsiveSize(16, 20)} 
          className="!text-primary mr-2" 
        />
        <Text className="text-text text-sm font-medium" numberOfLines={1}>
          {document.name}
        </Text>
        
        {showPreviewIcon && (
          <View className="ml-2 opacity-60">
            <Ionicons 
              name="eye-outline" 
              size={getResponsiveSize(14, 16)} 
              className="!text-text" 
            />
          </View>
        )}
        
        {document.pages && document.pages > 1 && (
          <View className="ml-2 bg-background rounded-full px-2 py-1">
            <Text className="text-secondary text-xs">
              {document.pages}p
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <DocumentPreviewModal
        isVisible={isPreviewVisible}
        document={document}
        onClose={() => setIsPreviewVisible(false)}
      />
    </>
  );
};
