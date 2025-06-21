import { View, Text } from "react-native";
import { useState } from "react";
import { Character } from "@/src/types/core";
import CharactersList from "@/src/components/character/CharactersList";
import EditCharacter from "@/src/components/character/EditCharacter";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  availableModelsAtom,
  polarisCharactersAtom,
  polarisModelsAtom,
  polarisDocumentsAtom,
  polarisToolsAtom,
} from "@/src/hooks/atoms";
import { useAtom } from "jotai";
import CharacterService from "@/src/services/character/CharacterService";
import { toastService } from "@/src/services/toastService";
import LogService from "@/utils/LogService";
import PolarisServer from "@/src/services/polaris/PolarisServer";

interface AdminCharactersPanelProps {}

export default function AdminCharactersPanel({}: AdminCharactersPanelProps) {
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(
    undefined,
  );
  const [availableModels] = useAtom(polarisModelsAtom);
  const [characters, setCharacters] = useAtom(polarisCharactersAtom);
  const [documents, setDocuments] = useAtom(polarisDocumentsAtom);
  const [availableTools] = useAtom(polarisToolsAtom);
  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
  };

  const handleAdd = () => {
    setEditingCharacter({
      id: "",
      name: "",
      content: "",
      icon: "person",
      exposeAsModel: true,
    });
  };

  const handleSave = async (character: Character) => {
    if (character.isServerResource) {
      // Update existing server character
      await PolarisServer.updateCharacter(character);
    } else {
      // Create new server character
      await PolarisServer.createCharacter(character);
    }

    // pull the latest characters from the server
    const updatedCharacters = await PolarisServer.getCharacters();
    setCharacters(updatedCharacters);

    setEditingCharacter(undefined);
  };

  const handleDelete = async (character: Character) => {
    try {
      await PolarisServer.deleteCharacter(character.id);
      // pull the latest characters from the server
      const updatedCharacters = await PolarisServer.getCharacters();
      setCharacters(updatedCharacters);
    } catch (error: any) {
      LogService.log(
        error,
        { component: "charactersAtom", function: "setter" },
        "error",
      );
      toastService.danger({
        title: "Error",
        description: `Failed to delete character: ${character.name}`,
      });
    }
    setEditingCharacter(undefined);
  };

  return (
    <View className={`flex-1 bg-background flex-row`}>
      <CharactersList
        characters={characters}
        setCharacters={setCharacters}
        onCharacterPress={handleEdit}
        onAddCharacter={handleAdd}
        title="Characters"
        className="p-2 w-1/4 border-border border-r-2"
      />

    {editingCharacter && <EditCharacter
              availableTools={availableTools}
              availableDocuments={documents}
              availableModels={availableModels}
              existingCharacter={editingCharacter}
              onSave={handleSave}
              onDelete={handleDelete}
              className="flex-1 w-3/4 mx-auto p-8"
            />}
            {!editingCharacter && (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="person-outline" size={64} className="text-secondary mb-4" />
                <Text className="text-xl font-medium text-secondary">No Character Selected</Text>
                <Text className="text-secondary mt-2">Select a character from the list to edit their details</Text>
              </View>
            )}

      
    </View>
  );
}
