import React from 'react';
import { Platform, View, Text } from 'react-native';
import { DocumentManager } from '@/src/components/documents/DocumentManager';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAtom, useAtomValue } from 'jotai';
import { documentsAtom, charactersAtom, currentIndexAtom, defaultThreadAtom, threadActionsAtom, userDocumentsAtom, userNotesAtom } from '@/src/hooks/atoms';
import { Document } from '@/src/types/core';
import { toastService } from '@/src/services/toastService';
import { router } from 'expo-router';
import { DocumentPickerAsset } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PDFService } from '@/src/services/PDFService';
import { format } from 'date-fns';


export default function DocumentsRoute() {
  const [documents] = useAtom(userDocumentsAtom);
  const [characters, setCharacters] = useAtom(charactersAtom);
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom);
  const [, dispatchThread] = useAtom(threadActionsAtom);
  const [userDocuments, setUserDocuments] = useAtom(userDocumentsAtom);
  const [userNotes, setUserNotes] = useAtom(userNotesAtom);
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
      name: file.name,
      path: finalPath,
      type: 'pdf',
      pages: 0, // We'll update this after parsing
    };
    const parsedDoc = await PDFService.parsePDF(newDoc);
    newDoc.pages = parsedDoc.pages;
    setUserDocuments([...userDocuments, newDoc]);

    toastService.success({
      title: 'Document processed',
      description: `Successfully processed the document`
    });



    // FOR POLARIS
    // // Create document object
    // const newDoc: Document = {
    //   id: Date.now().toString(),
    //   name: file.name,
    //   path: file.uri,
    //   type: 'pdf',
    //   pages: 0, // Will be updated after processing
    // };

    // // For web, we can get the file blob to send to server
    // let fileBlob: Blob | undefined;
    // if (Platform.OS === 'web') {
    //   try {
    //     const response = await fetch(file.uri);
    //     fileBlob = await response.blob();
    //   } catch (error) {
    //     console.error('Failed to get file blob:', error);
    //   }
    // }

    // await DocumentService.uploadDocument(newDoc, fileBlob);
    // const documents = await DocumentService.getDocuments();
    // setPolarisDocuments(documents);
    // onUpload(newDoc);


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
      if (Platform.OS === 'web' && window.innerWidth >= 768) {
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <DocumentManager 
          documents={documents} 
          characters={characters} 
          onDocumentDelete={onDocumentDelete} 
          onDocumentUpload={onDocumentUpload} 
          onStartDocumentChat={onStartDocumentChat}
        />
        <View className="flex-1 mt-8 border-t border-border pt-4">
          <Text className="text-xl font-semibold mb-4 text-primary">Notes</Text>
          <View className="space-y-2">
            {userNotes.map(note => (
              <View
                key={note.id}
                className="bg-card p-4 rounded-lg space-y-2 border border-border shadow-sm"
              >
                <View className="flex-row justify-between">
                  <Text className="text-lg font-semibold text-foreground tracking-tight">
                    {note.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground leading-relaxed">
                    {format(note.createdAt, 'dd/MM/yyyy HH:mm')}
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground leading-relaxed">
                  {note.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
} 