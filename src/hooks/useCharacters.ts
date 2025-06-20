import { useAtom, useSetAtom } from 'jotai';
import { Character } from '@/src/types/core';
import { userCharactersAtom, saveCustomPrompts } from './atoms';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

export function useCharacters() {
  const router = useRouter();
  const [characters, setCharacters] = useAtom(userCharactersAtom);
  const dispatchCharacters = useSetAtom(saveCustomPrompts);

  const handleEdit = (character: Character): Character => {
    if (Platform.OS === "web") {
      return character;
    } else {
      router.push({
        pathname: "/edit-character",
        params: { id: character.id }
      });
      return character;
    }
  };

  const handleAdd = (): Character => {
    const newCharacter: Character = {
      id: "",
      name: "",
      content: "",
      icon: "person"
    };

    if (Platform.OS === "web") {
      return newCharacter;
    } else {
      router.push("/edit-character");
      return newCharacter;
    }
  };

  const handleSave = async (character: Character) => {
    let updatedCharacters: Character[] = [];
    if (character.id === "") {
      // If character is new, add it to the characters array with a new UUID
      updatedCharacters = [...characters, {
        ...character,
        id: Crypto.randomUUID()
      }];
    } else {
      // If character exists, update it in the array
      updatedCharacters = characters.map((p) =>
        p.id === character.id ? character : p
      );
    }
    await dispatchCharacters(updatedCharacters);
    return updatedCharacters;
  };

  const handleDelete = async (character: Character) => {
    const updatedCharacters = characters.filter((p) => p.id !== character.id);
    await dispatchCharacters(updatedCharacters);
    return updatedCharacters;
  };

  const getCharacter = (id: string): Character | undefined => {
    return characters.find((character) => character.id === id);
  };

  const getAllCharacters = (): Character[] => {
    return characters;
  };

  return {
    characters,
    setCharacters,
    handleEdit,
    handleAdd,
    handleSave,
    handleDelete,
    getCharacter,
    getAllCharacters
  };
} 