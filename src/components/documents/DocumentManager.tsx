import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DocumentUploader } from "./DocumentUploader";
import { Document } from "@/src/types/core";
import { Platform } from "react-native";
import { DocumentViewer } from "./DocumentViewer";
import { modalService } from "@/src/services/modalService";
import { toastService } from "@/src/services/toastService";
import { DocumentPickerAsset } from "expo-document-picker";
import { useLocalization } from "@/src/hooks/useLocalization";
interface DocumentManagerProps {
  documents: Document[];
  characters: Array<{
    id: string;
    name: string;
    documentIds?: string[];
    [key: string]: any;
  }>;
  onDocumentDelete: (document: Document) => void;
  onDocumentUpload: (document: DocumentPickerAsset) => void;
  onStartDocumentChat: (document: Document) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  characters,
  onDocumentDelete,
  onDocumentUpload,
  onStartDocumentChat,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const { t } = useLocalization();
  const handleDocumentUpload = async (doc: DocumentPickerAsset) => {
    try {
      // Call the parent handler
      await onDocumentUpload(doc);
    } catch (error) {
      toastService.danger({
        title: "Processing failed",
        description:
          error instanceof Error ? error.message : "Failed to process document",
      });
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    const dependentCharacters = characters.filter((character) =>
      character.documentIds?.includes(document.id),
    );

    let confirmMessage = `Are you sure you want to delete "${document.name}"?`;

    if (dependentCharacters.length > 0) {
      confirmMessage += `\n\nThis document is used by ${dependentCharacters.length} character(s):\n${dependentCharacters
        .map((c) => `- ${c.name}`)
        .join(
          "\n",
        )}\n\nThe document reference will be removed from these characters.`;
    }
    const confirmed = await modalService.confirm({
      title: "Delete Document",
      message: confirmMessage,
    });

    if (!confirmed) return;

    try {
      // Remove the document
      await onDocumentDelete(document);

      // If the deleted document is currently selected, clear the selection
      if (selectedDoc?.id === document.id) {
        setSelectedDoc(null);
      }
    } catch (error) {
      toastService.danger({
        title: "Deletion failed",
        description:
          error instanceof Error ? error.message : "Failed to delete document",
      });
    }
  };

  const startDocumentChat = (doc: Document) => {
    try {
      onStartDocumentChat(doc);
    } catch (error) {
      toastService.danger({
        title: "Error",
        description: "Failed to start document chat",
      });
    }
  };

  const renderDocument = ({ item: doc }: { item: Document }) => {
    // Calculate the number of characters that depend on this document
    const dependentCharactersCount = characters.filter((character) =>
      character.documentIds?.includes(doc.id),
    ).length;

    return (
      <View className="flex-row items-center p-4 bg-surface rounded-lg mb-2">
        <Ionicons
          name="document-text"
          size={24}
          className="!text-primary mr-3"
        />
        <View className="flex-1">
          <Text className="text-text font-medium">{doc.name}</Text>
          <View className="flex-row items-center">
            <Text className="text-secondary text-sm">{doc.pages} {t('documents.pages')}</Text>
            <Text className="text-secondary text-sm">{doc.id}</Text>
            {dependentCharactersCount > 0 && (
              <View className="flex-row items-center ml-2">
                <Text className="text-secondary text-sm">•</Text>
                <Text className="text-secondary text-sm ml-2">
                  {t('documents.dependants')}: {dependentCharactersCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="p-2 bg-surface border border-primary rounded-lg"
            onPress={() => setSelectedDoc(doc)}
          >
            <Ionicons name="eye" size={20} className="!text-primary" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2 bg-primary rounded-lg"
            onPress={() => startDocumentChat(doc)}
          >
            <Ionicons name="chatbubble" size={20} className="!text-white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2 bg-red-500 rounded-lg"
            onPress={() => handleDeleteDocument(doc)}
          >
            <Ionicons name="trash" size={20} className="!text-white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 flex-row">
      <View className={`${selectedDoc ? "w-1/2" : "flex-1"}`}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center p-4">
            <Ionicons
              name="document-text"
              size={32}
              className="!text-primary mr-2 pb-2"
            />
            <Text className="text-2xl font-bold text-primary">{t('documents.documents')}</Text>
          </View>
          {documents.length > 0 && (
            <DocumentUploader
              onUpload={handleDocumentUpload}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          )}
        </View>

        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(doc) => doc.id}
          className={
            documents.length > 0
              ? "flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-4 gap-2"
              : "flex-1"
          }
          contentContainerStyle={{ flex: 1 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mx-auto my-auto">
              <DocumentUploader
                onUpload={handleDocumentUpload}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
              <Text className="text-gray-500 mt-2">
                {t('documents.no_documents_upload')}
              </Text>
            </View>
          }
        />
      </View>

      {selectedDoc && (
        <View className="w-1/2 pl-4">
          <DocumentViewer
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        </View>
      )}
    </View>
  );
};
