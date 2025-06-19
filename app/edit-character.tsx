import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EditCharacter from '@/src/components/character/EditCharacter';
import { availableModelsAtom, userDocumentsAtom, userToolsAtom } from '@/src/hooks/atoms';
import { useCharacters } from '@/src/hooks/useCharacters';

export default function EditCharacterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [availableDocuments] = useAtom(userDocumentsAtom);
  const [availableModels] = useAtom(availableModelsAtom);
  const [userTools] = useAtom(userToolsAtom);

  const { characters, handleEdit, handleAdd, handleSave, handleDelete } = useCharacters();
  const character = characters.find((c) => c.id === id);
  return <EditCharacter 
    availableTools={userTools.filter(tool=>tool.id !== "DocumentSearch")} 
    existingCharacter={character!} 
    onSave={(character) => handleSave(character)} 
    availableDocuments={availableDocuments} 
    availableModels={availableModels} 
    onDelete={() => handleDelete(character!)} 
  />;
} 