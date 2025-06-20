import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EditCharacter from '@/src/components/character/EditCharacter';
import { availableModelsAtom, userDocumentsAtom, userToolsAtom } from '@/src/hooks/atoms';
import { useCharacters } from '@/src/hooks/useCharacters';
import * as Crypto from 'expo-crypto';
import { Character } from '@/src/types/core';

export default function EditCharacterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [availableDocuments] = useAtom(userDocumentsAtom);
  const [availableModels] = useAtom(availableModelsAtom);
  const [userTools] = useAtom(userToolsAtom);

  const { characters, handleSave, handleDelete } = useCharacters();
  
  // If id is provided, we're editing an existing character
  // If not, we're creating a new one
  const character = id ? characters.find((c) => c.id === id) : {
    id: "",
    name: "",
    content: "",
    icon: "person"
  };

  if (id && !character) {
    // Handle case where character with given id is not found
    router.back();
    return null;
  }

  return <EditCharacter 
    availableTools={userTools.filter(tool=>tool.id !== "DocumentSearch")} 
    existingCharacter={character!} 
    onSave={async (updatedCharacter) => {
      await handleSave(updatedCharacter);
      router.back();
    }} 
    availableDocuments={availableDocuments} 
    availableModels={availableModels} 
    onDelete={(character: Character) => {
      handleDelete(character);
      router.back();
    }} 
  />;
} 