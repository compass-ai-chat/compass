import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, useWindowDimensions, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DocumentUploader } from "./DocumentUploader";
import { Document } from "@/src/types/core";
import { DocumentViewer } from "./DocumentViewer";
import { modalService } from "@/src/services/modalService";
import { toastService } from "@/src/services/toastService";
import { DocumentPickerAsset } from "expo-document-picker";
import { useLocalization } from "@/src/hooks/useLocalization";
import { useResponsiveStyles } from "@/src/hooks/useResponsiveStyles";
import { Modal } from "@/src/components/ui/Modal";
import { Platform } from "@/src/utils/platform";
import { SearchBar } from "../ui/SearchBar";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { SectionHeader } from "@/src/components/ui/SectionHeader";

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
  const { getResponsiveSize, getResponsiveClass, getResponsiveValue } = useResponsiveStyles();
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Common breakpoint for mobile devices
  const [search, setSearch] = useState("");
  

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

  const filteredDocuments = useMemo(() => {
      return documents.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    }, [documents, search]);

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

  const DocumentCard = ({ doc }: { doc: Document }) => {
    const dependentCharactersCount = characters.filter((character) =>
      character.documentIds?.includes(doc.id),
    ).length;

    return (
      <Pressable
        onPress={() => setSelectedDoc(doc)}
        className="group bg-surface rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style={({ pressed }) => [
          {
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }
        ]}
      >
        {/* Card Header */}
        <View className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="bg-primary/10 rounded-xl p-3 mr-3">
                <Ionicons
                  name="document-text"
                  size={getResponsiveSize(20, 24)}
                  className="!text-primary"
                />
              </View>
              <View className="flex-1">
                <Text 
                  className="text-text font-semibold text-base leading-tight mb-1" 
                  numberOfLines={2}
                >
                  {doc.name}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-primary/10 rounded-full px-2 py-1 mr-2">
                    <Text className="text-primary text-xs font-medium">
                      {doc.pages ?? 1} {doc.pages === 1 ? 'page' : 'pages'}
                    </Text>
                  </View>
                  {dependentCharactersCount > 0 && (
                    <View className="bg-secondary/10 rounded-full px-2 py-1">
                      <Text className="text-secondary text-xs font-medium">
                        {dependentCharactersCount} characters
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Card Actions */}
        <View className="p-4">
          <View className={`flex-row ${Platform.isMobile ? 'justify-center' : 'justify-end'} gap-3`}>
            <TouchableOpacity
              className="flex-1 max-w-[120px] bg-surface border border-primary rounded-xl px-4 py-3 flex-row items-center justify-center active:scale-95 hover:bg-primary/5"
              onPress={() => setSelectedDoc(doc)}
            >
              <Ionicons name="eye" size={getResponsiveSize(16, 18)} className="!text-primary mr-2" />
              <Text className="text-primary font-medium text-sm">Preview</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 max-w-[120px] bg-primary rounded-xl px-4 py-3 flex-row items-center justify-center active:scale-95 hover:bg-primary/90"
              onPress={() => startDocumentChat(doc)}
            >
              <Ionicons name="chatbubble" size={getResponsiveSize(16, 18)} className="!text-white mr-2" />
              <Text className="text-white font-medium text-sm">Chat</Text>
            </TouchableOpacity>
            
            {!Platform.isMobile && (
              <TouchableOpacity
                className="bg-red-50 border border-red-200 rounded-xl px-3 py-3 active:scale-95 hover:bg-red-100"
                onPress={() => handleDeleteDocument(doc)}
              >
                <Ionicons name="trash" size={getResponsiveSize(16, 18)} className="!text-red-500" />
              </TouchableOpacity>
            )}
          </View>

          {/* Mobile delete option */}
          {Platform.isMobile && (
            <TouchableOpacity
              className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center justify-center active:scale-95"
              onPress={() => handleDeleteDocument(doc)}
            >
              <Ionicons name="trash" size={getResponsiveSize(16, 18)} className="!text-red-500 mr-2" />
              <Text className="text-red-500 font-medium text-sm">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  const renderDocument = ({ item: doc }: { item: Document }) => (
    <View className={`${Platform.isMobile ? 'px-4 pb-4' : 'p-2'}`}>
      <DocumentCard doc={doc} />
    </View>
  );

  const EmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-16">
      <View className="bg-primary/5 rounded-full p-8 mb-6">
        <View className="bg-primary/10 rounded-full p-6">
          <Ionicons
            name="document-text"
            size={getResponsiveSize(48, 64)}
            className="!text-primary"
          />
        </View>
      </View>
      
      <Text className="text-text text-xl font-bold text-center mb-3">
        No Documents Yet
      </Text>
      
      <Text className="text-secondary text-center text-base mb-8 max-w-sm leading-relaxed">
        Upload your first PDF document to start chatting with your files and enhance your characters with knowledge.
      </Text>
      
      <DocumentUploader
        onUpload={handleDocumentUpload}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
      />
      
      <View className="mt-8 flex-row items-center">
        <View className="flex-1 h-px bg-border" />
        <Text className="mx-4 text-secondary text-sm">or</Text>
        <View className="flex-1 h-px bg-border" />
      </View>
      
      <TouchableOpacity className="mt-6 px-6 py-3 bg-surface border border-border rounded-xl flex-row items-center">
        <Ionicons name="help-circle" size={getResponsiveSize(16, 18)} className="!text-primary mr-2" />
        <Text className="text-primary font-medium">Learn more about documents</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Modern Header Section */}
      <View className="bg-surface/50 backdrop-blur-sm border-b border-border px-6 py-4">
        
        <SectionHeader
          title={t('documents.documents')}
          icon="document-text"
          rightContent={
            documents.length > 0 && (
              <DocumentUploader
                onUpload={handleDocumentUpload}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            )
          }
        />

        {/* Enhanced Search */}
        {documents.length > 0 && (
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search documents..."
            className="my-2"
          />
        )}
      </View>

      {/* Document Grid */}
      <View className="flex-1 px-2">
        {filteredDocuments.length > 0 ? (
          <FlatList
            data={filteredDocuments}
            renderItem={renderDocument}
            keyExtractor={(doc) => doc.id}
            numColumns={isMobile ? 1 : (width > 1024 ? 3 : 2)}
            key={`${isMobile ? 1 : (width > 1024 ? 3 : 2)}-${width}`} // Force re-render on column change
            contentContainerStyle={{ 
              paddingVertical: 16,
              paddingBottom: 32 
            }}
            columnWrapperStyle={!isMobile ? { justifyContent: 'flex-start' } : undefined}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        ) : (
          <EmptyState />
        )}
      </View>

      {/* Mobile Modal View */}
      {isMobile && (
        <Modal
          isVisible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          maxHeight="100%"
          className="m-0 flex-1"
        >
          {selectedDoc && (
            <View className="flex-1 bg-background">
              <DocumentViewer
                document={selectedDoc!}
                onClose={() => setSelectedDoc(null)}
              />
            </View>
          )}
        </Modal>
      )}

      {/* Desktop Split View */}
      {!isMobile && selectedDoc && (
        <DocumentPreviewModal
          isVisible={!!selectedDoc}
          document={selectedDoc!}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </View>
  );
};
