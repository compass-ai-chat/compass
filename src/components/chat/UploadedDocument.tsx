import React, { useState, useEffect } from "react";
import { View, Image, TouchableOpacity, Platform } from "react-native";
import { Text } from "react-native";


import { Document } from '@/src/types/core';
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { userDocumentsAtom } from "@/src/hooks/atoms";

interface UploadedDocumentProps {
  document: Document;
  onRemove: (document: Document) => void;
}

export const UploadedDocument: React.FC<UploadedDocumentProps> = ({
  document,
  onRemove,
}) => {
  const [userDocuments, setUserDocuments] = useAtom(userDocumentsAtom);

  return (
    <View className={`flex flex-row mb-2 items-center bg-surface border border-border rounded-lg p-2 mr-2`}
    >
      <Ionicons name="document-text-outline" size={20} className="!text-text mr-2" />
      <Text className="text-text text-sm text-center text-nowrap">{document.name}</Text>
      <TouchableOpacity className="hover:bg-background rounded-full p-1" onPress={() => {
        setUserDocuments(userDocuments.filter((d) => d.id !== document.id));
        onRemove(document);
      }}>
        <Ionicons name="close-outline" size={20} className="!text-text" />
      </TouchableOpacity>
    </View>
  );
};
