import { useState, useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Model, Character } from '@/src/types/core';
import { 
  currentThreadAtom, 
  threadActionsAtom,
  availableProvidersAtom,
  availableModelsAtom,
  charactersAtom,
} from '@/src/hooks/atoms';
import { fetchAvailableModelsV2 } from '@/src/hooks/useModels';

export const useCharacterModelSelection = () => {
  const [currentThread] = useAtom(currentThreadAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const [providers] = useAtom(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom);
  const characters = useAtomValue(charactersAtom);

  const [selectedModel, setSelectedModel] = useState<Model>();
  const [selectedCharacter, setSelectedCharacter] = useState<Character>();

  const loadCharacterAndModel = () => {
    const noCharacterOrModel = !currentThread.selectedModel && !currentThread.character;

    if (noCharacterOrModel) {
      // pick first model and character
      setSelectedModel(models[0]);
      setSelectedCharacter(characters[0]);
    } else {
      setSelectedModel(currentThread.selectedModel);
      setSelectedCharacter(currentThread.character);
    }
  };

  const loadFreshModelList = async () => {
    const fetchedModels = await fetchAvailableModelsV2(providers.filter((p) => p.capabilities?.llm));
    setModels(fetchedModels);
  };

  const getCharacterModel = (character: Character) => {
    if (character.allowedModels?.length) {
      // fetch allowed model from character
      return models.find((m) => character?.allowedModels?.map(x => x.id).includes(m.id));
    }
    // use first model if no models are available
    return models.find(x => true);
  };

  const setCharacterAndModel = (character: Character | undefined, model: Model | undefined) => {
    setSelectedCharacter(character);
    setSelectedModel(model);
    dispatchThread({
      type: 'update',
      payload: { ...currentThread, character: character, selectedModel: model }
    });
  };

  const handleModelSelection = (model: Model) => {
    setCharacterAndModel(undefined, model);
  };

  const handleCharacterSelection = (character: Character) => {
    const characterModel = getCharacterModel(character);
    setCharacterAndModel(character, characterModel);
  };

  // Load character and model when thread changes
  useEffect(() => {
    loadCharacterAndModel();
  }, [currentThread.id, models, characters]);

  // Load fresh model list when providers change
  useEffect(() => {
    loadFreshModelList();
  }, [providers]);

  return {
    selectedModel,
    selectedCharacter,
    models,
    characters,
    setCharacterAndModel,
    handleModelSelection,
    handleCharacterSelection,
    getCharacterModel,
    loadFreshModelList,
  };
}; 