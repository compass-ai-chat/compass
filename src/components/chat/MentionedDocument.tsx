import React, { useState, useEffect } from "react";
import { View, Image, TouchableOpacity, Platform } from "react-native";
import { Text } from "react-native";


import { Document } from '@/src/types/core';
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { userDocumentsAtom } from "@/src/hooks/atoms";

interface MentionedDocumentProps {
  documentId: string;
}

export const MentionedDocument: React.FC<MentionedDocumentProps> = ({
  documentId,
}) => {
  const [userDocuments, setUserDocuments] = useAtom(userDocumentsAtom);

  return (
    <View className={`flex flex-row mb-2 items-center bg-surface border border-border rounded-lg p-2 mr-2`}
    >
      <Ionicons name="document-text-outline" size={20} className="!text-text mr-2" />
      <Text className="text-text text-sm text-center text-nowrap">{userDocuments.find(d => d.id === documentId)?.name}</Text>
    </View>
  );
};
