import React from 'react';
import { Platform, View, Text, ScrollView } from 'react-native';
import { DocumentManager } from '@/src/components/documents/DocumentManager';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAtom, useAtomValue } from 'jotai';
import { documentsAtom, charactersAtom, currentIndexAtom, defaultThreadAtom, threadActionsAtom } from '@/src/hooks/atoms';
import { Document } from '@/src/types/core';
import { toastService } from '@/src/services/toastService';
import { router } from 'expo-router';
import { DocumentPickerAsset } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PDFService } from '@/src/services/PDFService';
import { format } from 'date-fns';


export default function DocumentsRoute() {
  const [documents, setDocuments] = useAtom(documentsAtom);
  const [characters, setCharacters] = useAtom(charactersAtom);
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom);
  const [, dispatchThread] = useAtom(threadActionsAtom);
  const defaultThread = useAtomValue(defaultThreadAtom);

  const onDocumentDelete = async (document: Document) => {

    const dependentCharacters = characters.filter(
      character => character.documentIds?.includes(document.id)
    );

    if (dependentCharacters.length > 0) {
      const updatedCharacters = characters.map(character => {
        if (character.documentIds?.includes(document.id)) {
          return {
            ...character,
            documentIds: character.documentIds.filter(id => id !== document.id)
          };
        }
        return character;
      });
      
      setCharacters(updatedCharacters);
    }

    // finally, delete the document from the documents array
    setDocuments(documents.filter(doc => doc.id !== document.id));

  };

  const onDocumentUpload = async (file: DocumentPickerAsset) => {
    let finalPath = file.uri;
    if (Platform.OS !== 'web') {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) throw new Error('No document directory available');
      
      const newPath = `${documentDir}documents/${file.name}`;
      await FileSystem.makeDirectoryAsync(`${documentDir}documents`, { intermediates: true });
      await FileSystem.copyAsync({ from: file.uri, to: newPath });
      finalPath = newPath;
    }

    const newDoc: Document = {
      id: Date.now().toString(),
      createdAt: new Date(),
      name: file.name,
      path: finalPath,
      type: 'pdf',
      pages: 0, // We'll update this after parsing
      chunks: []
    };
    const parsedDoc = await PDFService.parsePDF(newDoc);
    newDoc.pages = parsedDoc.pages;
    newDoc.chunks = parsedDoc.chunks;
    setDocuments([...documents, newDoc]);

    toastService.success({
      title: 'Document processed',
      description: `Successfully processed the document`
    });

  };

  const onStartDocumentChat = async (doc: Document) => {
    try {
      // Create new thread with document context
      const newThread = {...defaultThread, id: Date.now().toString()};
      
      // Store document reference in thread metadata
      newThread.metadata = {
        documentIds: [doc.id]
      };

      await dispatchThread({ type: 'add', payload: newThread });
      await dispatchThread({ type: 'setCurrent', payload: newThread });

      // Navigate to chat
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth >= 768) {
        // Set the current index to 0 (Chat tab) before navigation
        setCurrentIndex(0);
        router.replace('/');
      } else {
        router.push(`/thread/${newThread.id}`);
      }
    } catch (error) {
      toastService.danger({
        title: 'Error',
        description: 'Failed to start document chat'
      });
    }
  };

  return (
    <View className="flex-1 p-4">
      <DocumentManager 
        documents={documents} 
        characters={characters} 
        onDocumentDelete={onDocumentDelete} 
        onDocumentUpload={onDocumentUpload} 
        onStartDocumentChat={onStartDocumentChat}
      />
    </View>
  );
} 