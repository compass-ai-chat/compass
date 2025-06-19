// src/hooks/useProviders.ts
import { useAtom } from "jotai";
import { getDefaultStore } from "jotai";
import { availableProvidersAtom, availableModelsAtom } from "@/src/hooks/atoms";
import { Provider, Model } from "@/src/types/core";
import { fetchAvailableModelsV2 } from "@/src/hooks/useModels";
import { toastService } from "@/src/services/toastService";
import { useLocalization } from "@/src/hooks/useLocalization";
import { v4 as uuidv4 } from 'uuid';

export function useProviders() {
  const { t } = useLocalization();
  const [providers, setProviders] = useAtom(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom);

  /**
   * Add a new provider to the list and fetch its models
   */
  const addUpdateProvider = async (provider: Provider): Promise<Provider> => {
    // Add a unique ID if not provided
    const providerWithId = {
      ...provider,
      id: provider.id || uuidv4(),
    };

    // If the provider already exists, update it
    const existingProvider = providers.find((p) => p.id === providerWithId.id);
    if (existingProvider) {
      await setProviders(providers.map((p) => p.id === providerWithId.id ? providerWithId : p));
    } else {
      // Add the provider to the list
      await setProviders([...providers, providerWithId]);
    }

    const modelsFound = await fetchAvailableModelsV2([providerWithId]);
    setModels([...models, ...modelsFound]);

    return providerWithId;
  };

  /**
   * Update an existing provider
   */
  const updateProvider = async (provider: Provider): Promise<void> => {
    const updated = providers.map((p) =>
      p.id === provider.id ? provider : p
    );
    await setProviders(updated);

    // Refresh models for this provider
    try {
      const modelsFound = await fetchAvailableModelsV2([provider]);
      
      // Remove old models for this provider and add new ones
      const filteredModels = models.filter(
        (model) => model.provider.id !== provider.id
      );
      setModels([...filteredModels, ...modelsFound]);

      toastService.success({
        title: t("settings.providers.provider_saved"),
        description: t("settings.providers.provider_saved_description"),
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      toastService.danger({
        title: t("settings.providers.failed_to_load_models"),
        description: t("settings.providers.models_fetch_error"),
      });
    }
  };

  /**
   * Delete a provider
   */
  const deleteProvider = async (provider: Provider): Promise<void> => {
    const updated = providers.filter((p) => p.id !== provider.id);
    await setProviders(updated);

    // Remove models associated with this provider
    const updatedModels = models.filter(
      (model) => model.provider.id !== provider.id
    );
    setModels(updatedModels);
  };

  /**
   * Refresh models for a specific provider
   */
  const refreshProviderModels = async (provider: Provider): Promise<void> => {
    try {
      const fetchedModels = await fetchAvailableModelsV2([provider]);
      
      // Remove old models for this provider
      const filteredModels = models.filter(
        (model) => model.provider.id !== provider.id
      );
      
      // Add new models
      setModels([...filteredModels, ...fetchedModels]);
    } catch (error) {
      console.error("Error fetching models:", error);
      toastService.danger({
        title: t("settings.providers.failed_to_load_models"),
        description: t("settings.providers.models_fetch_error"),
      });
    }
  };

  /**
   * Refresh models for all providers
   */
  const refreshAllModels = async (): Promise<void> => {
    try {
      const allProviders = await getDefaultStore().get(availableProvidersAtom);
      const modelsFound = await fetchAvailableModelsV2(allProviders);
      setModels(modelsFound || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      toastService.danger({
        title: t("settings.providers.failed_to_load_models"),
        description: t("settings.providers.models_fetch_error"),
      });
    }
  };

  return {
    providers,
    models,
    addUpdateProvider,
    updateProvider,
    deleteProvider,
    refreshProviderModels,
    refreshAllModels,
  };
}