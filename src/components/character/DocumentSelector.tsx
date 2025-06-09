import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Document } from "@/src/types/core";
import { useLocalization } from "@/src/hooks/useLocalization";
interface DocumentSelectorProps {
  documents: Document[];
  selectedDocIds: string[];
  onSelectDoc: (docId: string) => void;
  onRemoveDoc?: (docId: string) => void;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  selectedDocIds,
  onSelectDoc,
  onRemoveDoc,
}) => {
  const { t } = useLocalization();
  // Find any selected document IDs that no longer exist in the documents list
  const missingDocIds = selectedDocIds.filter(
    (id) => !documents.some((doc) => doc.id === id),
  );

  return (
    <View className="mt-6">
      <View className="flex-row items-center mb-2">
        <Ionicons name="document-text" size={24} className="!text-primary mr-2" />
        <Text className="text-base font-medium text-text">
          {t('characters.edit_character.available_documents')}
        </Text>
      </View>
      <ScrollView className="max-h-40 bg-surface rounded-lg border-2 border-border">
        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            onPress={() => {
              if (selectedDocIds.includes(doc.id)) {
                onRemoveDoc ? onRemoveDoc(doc.id) : onSelectDoc(doc.id);
              } else {
                onSelectDoc(doc.id);
              }
            }}
            className="flex-row items-center p-3 border-b border-border"
          >
            <Ionicons
              name={
                selectedDocIds.includes(doc.id) ? "checkbox" : "square-outline"
              }
              size={24}
              className="!text-primary mr-2"
            />
            <View className="flex-1">
              <Text className="text-text">{doc.name}</Text>
              <Text className="text-secondary text-sm">{doc.pages} {t('documents.pages')}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Display missing documents with warning */}
        {missingDocIds.length > 0 && (
          <View className="p-3 bg-yellow-100 dark:bg-yellow-900 border-b border-border">
            <Text className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
              {t('documents.missing_documents')}
            </Text>
            <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
              {t('documents.missing_documents_warning')}
            </Text>
          </View>
        )}

        {documents.length === 0 && missingDocIds.length === 0 && (
          <Text className="text-secondary p-3">
            {t('documents.no_documents_available')}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};
