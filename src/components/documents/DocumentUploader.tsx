import React from 'react';
import { TouchableOpacity, Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Document } from '@/src/types/core';
import { toastService } from '@/src/services/toastService';
import * as FileSystem from 'expo-file-system';
import { syncToPolarisAtom, documentsAtom, polarisDocumentsAtom, userDocumentsAtom } from '@/src/hooks/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { DocumentService } from '@/src/services/document/DocumentService';
import { PDFService } from '@/src/services/PDFService';
import { useLocalization } from '@/src/hooks/useLocalization';
interface DocumentUploaderProps {
  onUpload: (doc: DocumentPicker.DocumentPickerAsset) => void;
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUpload,
  isUploading,
  setIsUploading
}) => {
  const { t } = useLocalization();
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

      onUpload(file);


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
    <TouchableOpacity
      onPress={handleUpload}
      disabled={isUploading}
      className={`p-3 rounded-lg flex-row items-center gap-2 ${
        isUploading ? 'opacity-50' : ''
      } bg-primary`}
    >
      <Ionicons 
        name={isUploading ? 'cloud-upload' : 'add'} 
        size={24} 
        className="!text-white" 
      />
      <Text className="text-white">{t('documents.upload')} </Text>
    </TouchableOpacity>
  );
}; 