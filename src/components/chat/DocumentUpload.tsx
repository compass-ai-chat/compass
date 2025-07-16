import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';

import {
  currentThreadAtom,
  hotToolsAtom,
  thinkingActiveAtom,
  userDocumentsAtom,
} from "@/src/hooks/atoms";
import { useAtom } from "jotai";
import { FontAwesome6 } from "@expo/vector-icons";
import { toastService } from "@/src/services/toastService";
import { PDFService } from "@/src/services/PDFService";
import { Document } from '@/src/types/core';

interface DocumentUploadProps {
  className?: string;
  onDocumentUpload: (document: Document) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({className, onDocumentUpload}) => {
  const [currentThread, setCurrentThread] = useAtom(currentThreadAtom);
  const [isUploading, setIsUploading] = useState(false);
  const [userDocuments, setUserDocuments] = useAtom(userDocumentsAtom);


  const handleUpload = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Basic validation
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toastService.danger({
          title: 'Invalid file type',
          description: 'Please upload a PDF file'
        });
        return;
      }

      const newDoc: Document = {
        id: Date.now().toString(),
        createdAt: new Date(),
        name: file.name,
        path: file.uri,
        type: 'pdf',
        pages: 0, // We'll update this after parsing
        chunks: []
      };
      const parsedDoc = await PDFService.parsePDF(newDoc);
      newDoc.pages = parsedDoc.pages;
      newDoc.chunks = parsedDoc.chunks;
      setUserDocuments([...userDocuments, newDoc]);
      onDocumentUpload(newDoc);

      toastService.success({
        title: 'Document uploaded',
        description: 'Document uploaded successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      toastService.danger({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Pressable
      onPress={() => handleUpload()}
      className={`flex-row items-center p-2 rounded-md border border-border ${className}`}
            >
              <Ionicons name="document-text-outline" size={20} className="!text-text" />
              <Text className="ml-2 text-text text-2xl">+</Text>
      </Pressable>
  );
};
