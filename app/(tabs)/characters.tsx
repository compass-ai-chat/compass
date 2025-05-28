import { View, Platform } from "react-native";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultThreadAtom,
  currentIndexAtom,
  threadActionsAtom,
  threadsAtom,
  saveCustomPrompts,
  userCharactersAtom,
} from "@/src/hooks/atoms";
import { Character } from "@/src/types/core";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import EditCharacter from "@/src/components/character/EditCharacter";
import CharactersList from "@/src/components/character/CharactersList";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { availableModelsAtom, userDocumentsAtom } from "@/src/hooks/atoms";
export default function CharactersScreen() {
  const router = useRouter();
  const [characters, setCharacters] = useAtom(userCharactersAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const threads = useAtomValue(threadsAtom);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null,
  );
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom);
  const [availableModels] = useAtom(availableModelsAtom);
  const dispatchCharacters = useSetAtom(saveCustomPrompts);
  const [availableDocuments] = useAtom(userDocumentsAtom);
  const defaultThread = useAtomValue(defaultThreadAtom);
  const handleEdit = (character: Character) => {
    if (Platform.OS == "web") {
      if (editingCharacter?.id === character.id) {
        setEditingCharacter(null);
      } else {
        setEditingCharacter(character);
      }
    } else {
      router.push(`/edit-character?id=${character.id}`);
    }
  };

  const handleAdd = () => {
    if (Platform.OS == "web") {
      setEditingCharacter({
        id: "",
        name: "",
        content: "",
        icon: "person",
      });
    } else {
      router.push("/edit-character");
    }
  };

  const handleSave = async (character: Character) => {
    // if character is new, add it to the characters array
    let updatedCharacters: Character[] = [];
    if (character.id === "") {
      updatedCharacters = [...characters, {
        ...character, 
        id: crypto.randomUUID()
      }];
    }
    // if character exists, update the characters array
    else {
      updatedCharacters = characters.map((p) =>
        p.id === character.id ? character : p,
      );
    }
    await dispatchCharacters(updatedCharacters);

    setEditingCharacter(null);
  };

  const handleDelete = async (character: Character) => {
    const updatedCharacters = characters.filter((p) => p.id !== character.id);
    await dispatchCharacters(updatedCharacters);
    setEditingCharacter(null);
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
      if (Platform.OS == "web") {
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
      if (Platform.OS == "web") {
        setCurrentIndex(0);
        router.replace("/");
      } else {
        router.push(`/thread/${newThread.id}`);
      }
    }, 100);
  };

  return (
    <View className="flex-1 bg-background flex-row">
      <CharactersList
        characters={characters}
        onCharacterPress={handleEdit}
        onCharacterLongPress={startChat}
        onAddCharacter={handleAdd}
        className="flex-1 p-4"
        setCharacters={setCharacters}
      />

      {editingCharacter && (
        <View className="flex-1 m-4 relative">
          <EditCharacter
            availableTools={[]}
            availableDocuments={availableDocuments}
            availableModels={availableModels}
            existingCharacter={editingCharacter}
            onSave={handleSave}
            onDelete={handleDelete}
            className="flex-1 bg-surface rounded-xl shadow-lg"
          />
          <TouchableOpacity
            onPress={() => setEditingCharacter(null)}
            className="absolute top-2 right-2 bg-surface/80 dark:bg-surface/60 p-2 rounded-full z-10"
          >
            <Ionicons name="close" size={24} className="text-text" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
