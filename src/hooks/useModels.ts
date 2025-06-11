import AsyncStorage from "@react-native-async-storage/async-storage";
import { Model, Provider } from "@/src/types/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  availableProvidersAtom,
  availableModelsAtom,
  logsAtom,
} from "@/src/hooks/atoms";
import { useEffect, useCallback, useRef, useMemo } from "react";
import LogService from "@/utils/LogService";
import { ChatProviderFactory } from "../services/chat/ChatProviderFactory";

export const loadDefaultModel = async (): Promise<Model | null> => {
  try {
    const storedDefault = await AsyncStorage.getItem("defaultModel");
    if (storedDefault) {
      return JSON.parse(storedDefault);
    }
  } catch (error) {
    console.error("Error loading default model:", error);
  }
  return null;
};

export function useModels() {
  const setDefaultModel = async (model: Model) => {
    try {
      if (model) {
        await AsyncStorage.setItem("defaultModel", JSON.stringify(model));
      }
    } catch (error) {
      console.error("Error saving default model:", error);
    }
  };

  const loadDefaultModel = async () => {
    try {
      const storedDefault = await AsyncStorage.getItem("defaultModel");
      if (storedDefault) {
        return storedDefault;
      }
    } catch (error) {
      console.error("Error loading default model:", error);
    }
  };

  return {
    setDefaultModel,
  };
}

let isLoadingModels = false;

export const fetchAvailableModelsV2 = async (
  endpoints: Provider[],
): Promise<Model[]> => {
  isLoadingModels = true;
  try {
    if (!endpoints?.length) {
      return [];
    }

    const models: Model[] = [];

    for (const provider of endpoints) {
      try {
        const providerInstance = ChatProviderFactory.getProvider(provider);

        const availableModels = await providerInstance.getAvailableModels();

        models.push(
          ...availableModels.map((model: string) => ({
            id: model,
            name: model,
            provider: provider,
            providerId: provider.id,
            pricePerMillionInputTokens: 0,
            pricePerMillionOutputTokens: 0,
          })),
        );
      } catch (error: any) {
        LogService.log(
          error,
          { component: "useModelFetching", function: "fetchAvailableModelsV2" },
          "error",
        );
      }
    }

    return models;
  } catch (error: any) {
    LogService.log(
      error,
      { component: "useModelFetching", function: "fetchAvailableModelsV2" },
      "error",
    );
  } finally {
    isLoadingModels = false;
  }
  return [];
};
