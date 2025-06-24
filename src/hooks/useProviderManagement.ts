import { useState, useEffect, useCallback } from 'react';
import { useAtom, getDefaultStore } from 'jotai';
import { availableProvidersAtom, availableModelsAtom } from '@/src/hooks/atoms';
import { Provider } from '@/src/types/core'; // Model import removed as it's not directly used here for type def
import { fetchAvailableModelsV2 } from '@/src/hooks/useModels';
import { toastService } from '@/src/services/toastService';
import { useLocalization } from '@/src/hooks/useLocalization';

export const useProviderManagement = () => {
  const { t } = useLocalization();
  const [providers, setProviders] = useAtom(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom);

  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchAllModels = useCallback(async (currentProviders: Provider[]) => {
    // console.log("Fetching all models based on current providers:", currentProviders);
    if (currentProviders.length === 0) {
        // console.log("No providers, setting models to empty array.");
        setModels([]); // Clear models if no providers
        return;
    }
    try {
      const allModels = await fetchAvailableModelsV2(currentProviders);
      // console.log("Fetched all models:", allModels);
      setModels(allModels);
    } catch (error) {
      console.error("Error fetching all models:", error);
      toastService.danger({
        title: t('settings.providers.failed_to_load_models', {defaultValue: "Failed to Load Models"}),
        description: t('settings.providers.models_fetch_error_generic', {defaultValue: "Could not fetch models for all providers."}),
      });
    }
  }, [setModels, t]);

  useEffect(() => {
    // Fetch models whenever the providers list changes
    // Using getDefaultStore().get() here might lead to stale `providers` data if the effect
    // closure captures an old version. It's better to rely on the `providers` state variable from `useAtom`.
    // console.log("Providers atom changed, refetching all models.");
    fetchAllModels(providers);
  }, [providers, fetchAllModels]);

  const openModalToEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setIsModalVisible(true);
  };

  const openModalToCreate = () => {
    setEditingProvider(undefined);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setEditingProvider(undefined);
    setIsModalVisible(false);
  };

  const saveProvider = async (providerToSave: Provider) => {
    let isNewProvider = false;
    if (editingProvider) { // Existing provider
      setProviders(prev => prev.map(p => p.id === editingProvider.id ? providerToSave : p));
    } else { // New provider
      isNewProvider = true;
      setProviders(prev => [...prev, { ...providerToSave, id: Date.now().toString() + Math.random().toString(36).substring(2,9) }]);
    }

    // The useEffect on `providers` will handle fetching all models.
    // If it's a new provider, or if endpoint/key changed, models for it will be fetched.
    // If it's just a name change, fetchAllModels will still run but might not change underlying models for that provider.

    toastService.success({
      title: t('settings.providers.provider_saved', {defaultValue: "Provider Saved"}),
      description: t('settings.providers.provider_saved_description', {defaultValue: "The provider configuration has been saved."}),
    });
    closeModal();
  };

  const deleteProvider = async (providerToDelete: Provider) => {
    setProviders(prev => prev.filter(p => p.id !== providerToDelete.id));
    // The useEffect on `providers` will cause `fetchAllModels` to run,
    // which will naturally exclude models from the deleted provider.
    toastService.info({
      title: t('settings.providers.provider_deleted_title', {defaultValue: "Provider Deleted"}),
      description: t('settings.providers.provider_deleted_description', { providerName: providerToDelete.name, defaultValue: `${providerToDelete.name} has been deleted.` }),
    });
  };

  const refreshProviderModels = async (providerToRefresh: Provider) => {
    try {
      // console.log(`Refreshing models for provider: ${providerToRefresh.name}`);
      const fetchedProviderModels = await fetchAvailableModelsV2([providerToRefresh]);
      // console.log(`Fetched models for ${providerToRefresh.name}:`, fetchedProviderModels);

      setModels(prevModels => [
        ...prevModels.filter(m => m.providerId !== providerToRefresh.id), // Remove old models for this provider
        ...fetchedProviderModels, // Add new ones
      ]);

      toastService.success({
        title: t('settings.providers.models_refreshed_title', {defaultValue: "Models Refreshed"}),
        description: t('settings.providers.models_refreshed_description', { providerName: providerToRefresh.name, defaultValue: `Models for ${providerToRefresh.name} have been refreshed.` }),
      });
    } catch (error) {
      console.error(`Error refreshing models for ${providerToRefresh.name}:`, error);
      toastService.danger({
        title: t('settings.providers.failed_to_load_models', {defaultValue: "Failed to Load Models"}),
        description: t('settings.providers.models_fetch_error_specific', { providerName: providerToRefresh.name, defaultValue: `Could not refresh models for ${providerToRefresh.name}.` }),
      });
    }
  };

  return {
    providers, // from atom
    models,    // from atom, updated by this hook
    editingProvider,
    isModalVisible,
    openModalToEdit,
    openModalToCreate,
    closeModal,
    saveProvider,
    deleteProvider,
    refreshProviderModels,
    fetchAllModels, // Exposing this if manual refresh of all models is needed elsewhere
  };
};
