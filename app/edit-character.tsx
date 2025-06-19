import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EditCharacter from '@/src/components/character/EditCharacter';
import { availableModelsAtom, userDocumentsAtom } from '@/src/hooks/atoms';

export default function EditCharacterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [availableDocuments] = useAtom(userDocumentsAtom);
  const [availableModels] = useAtom(availableModelsAtom);
  
  return <EditCharacter availableTools={[]} onSave={() => router.back()} availableDocuments={availableDocuments} availableModels={availableModels} />;
} 