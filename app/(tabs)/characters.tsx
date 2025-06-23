import { View, Text } from "react-native";
import { Platform } from "@/src/utils/platform";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultThreadAtom,
  currentIndexAtom,
  threadActionsAtom,
  threadsAtom,
  availableModelsAtom,
  userDocumentsAtom,
  userToolsAtom,
} from "@/src/hooks/atoms";
import { Character } from "@/src/types/core";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import EditCharacter from "@/src/components/character/EditCharacter";
import CharactersList from "@/src/components/character/CharactersList";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { useCharacters } from "@/src/hooks/useCharacters";

export default function CharactersScreen() {
  const router = useRouter();
  const dispatchThread = useSetAtom(threadActionsAtom);
  const threads = useAtomValue(threadsAtom);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom);
  const [availableModels] = useAtom(availableModelsAtom);
  const [availableDocuments] = useAtom(userDocumentsAtom);
  const defaultThread = useAtomValue(defaultThreadAtom);
  const [userTools] = useAtom(userToolsAtom);
  const { characters, setCharacters, handleEdit, handleAdd, handleSave, handleDelete } = useCharacters();

  const onEdit = (character: Character) => {
    if (!Platform.isMobile) {
      if (editingCharacter?.id === character.id) {
        setEditingCharacter(undefined);
      } else {
        const editedCharacter = handleEdit(character);
        setEditingCharacter(editedCharacter);
      }
    } else {
      handleEdit(character);
    }
  };

  const onAdd = () => {
    if (!Platform.isMobile) {
      const newCharacter = handleAdd();
      setEditingCharacter(newCharacter);
    } else {
      handleAdd();
    }
  };

  const onSave = async (character: Character) => {
    await handleSave(character);
    setEditingCharacter(undefined);
  };

  const onDelete = async (character: Character) => {
    await handleDelete(character);
    setEditingCharacter(undefined);
  };

  const startChat = async (character: Character) => {
    const latestThread = threads[threads.length - 1];

    if (latestThread && latestThread.messages.length === 0) {
      const defaultModel = await AsyncStorage.getItem("defaultModel");
      latestThread.selectedModel = defaultModel
        ? JSON.parse(defaultModel)
        : {
            id: "",
            provider: { source: "ollama", endpoint: "", apiKey: "" },
          };
      latestThread.character = character;

      await dispatchThread({ type: "update", payload: latestThread });
      await dispatchThread({ type: "setCurrent", payload: latestThread });
      if (!Platform.isMobile) {
        setCurrentIndex(0);
        router.replace("/");
      } else {
        router.push(`/thread/${latestThread.id}`);
      }
      return;
    }

    const defaultModel = await AsyncStorage.getItem("defaultModel");
    const newThread = {...defaultThread, id: Date.now().toString()};
    newThread.selectedModel = defaultModel
      ? JSON.parse(defaultModel)
      : {
          id: "",
          provider: { source: "ollama", endpoint: "", apiKey: "" },
        };
    newThread.character = character;

    await dispatchThread({ type: "add", payload: newThread });

    setTimeout(() => {
      if (!Platform.isMobile) {
        setCurrentIndex(0);
        router.replace("/");
      } else {
        router.push(`/thread/${newThread.id}`);
      }
    }, 100);
  };

  return (
    <View className="flex-1 bg-background flex-row mt-2">

      <CharactersList
        characters={characters}
        onCharacterPress={onEdit}
        onCharacterLongPress={startChat}
        onAddCharacter={onAdd}
        className={`p-2 border-border border-r-2 ${Platform.isMobile ? 'w-full' : 'w-1/4'}`}
        setCharacters={setCharacters}
        onDeleteCharacter={onDelete}
        selectedCharacter={editingCharacter}
      />

      {editingCharacter && <EditCharacter
          availableTools={userTools.filter(tool=>tool.id !== "DocumentSearch")}
          availableDocuments={availableDocuments}
          availableModels={availableModels}
          existingCharacter={editingCharacter}
          onSave={onSave}
          onDelete={onDelete}
          className="flex-1 w-3/4 mx-auto p-8"
        />}
        {!editingCharacter && (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="person-outline" size={64} className="text-secondary mb-4" />
            <Text className="text-xl font-medium text-secondary">No Character Selected</Text>
            <Text className="text-secondary mt-2">Select a character from the list to edit their details</Text>
          </View>
        )}

      {/* {editingCharacter && (
        <View className="flex-1 m-4 relative">
          <EditCharacter
            availableTools={userTools.filter(tool=>tool.id !== "DocumentSearch")}
            availableDocuments={availableDocuments}
            availableModels={availableModels}
            existingCharacter={editingCharacter}
            onSave={onSave}
            onDelete={onDelete}
            className="flex-1 bg-surface rounded-xl shadow-lg"
          />
          <TouchableOpacity
            onPress={() => setEditingCharacter(null)}
            className="absolute top-2 right-2 bg-surface/80 dark:bg-surface/60 p-2 rounded-full z-10"
          >
            <Ionicons name="close" size={24} className="text-text" />
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
}
