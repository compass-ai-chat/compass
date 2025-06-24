import { useState, useEffect } from 'react';
import { useAtom, getDefaultStore } from 'jotai';
import { availableProvidersAtom, availableModelsAtom } from '@/src/hooks/atoms';
import { Provider, Model } from '@/src/types/core';
import { fetchAvailableModelsV2 } from '@/src/hooks/useModels';
import { toastService } from '@/src/services/toastService';
import { useLocalization } from '@/src/hooks/useLocalization';

export const useProviderManagement = () => {
  const { t } = useLocalization();
  const [providers, setProviders] = useAtom(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom); // Corrected: models is also managed by an atom

  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false); // For EndpointModal visibility

  // Effect to fetch all models when providers change
  useEffect(() => {
    // console.log("Providers changed, fetching all models.");
    // getDefaultStore().get(availableProvidersAtom) ensures we use the latest providers list from the store
    fetchAvailableModelsV2(getDefaultStore().get(availableProvidersAtom))
      .then(setModels)
      .catch(error => {
        console.error("Error fetching all models after provider change:", error);
        toastService.danger({
          title: t('settings.providers.failed_to_load_models'),
          description: t('settings.providers.models_fetch_error_generic'),
        });
      });
  }, [providers, setModels, t]);

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
    if (editingProvider) { // Existing provider
      setProviders(prev => prev.map(p => p.id === editingProvider.id ? providerToSave : p));
    } else { // New provider
      setProviders(prev => [...prev, { ...providerToSave, id: Date.now().toString() + Math.random().toString() }]);
    }
    // Models will be refetched by the useEffect due to providers changing.
    toastService.success({
      title: t('settings.providers.provider_saved'),
      description: t('settings.providers.provider_saved_description'),
    });
    closeModal();
  };

  const deleteProvider = async (providerToDelete: Provider) => {
    setProviders(prev => prev.filter(p => p.id !== providerToDelete.id));
    // Models associated with this provider will implicitly be removed by the useEffect refetch,
    // or if fetchAvailableModelsV2 is smart, it won't return models for deleted providers.
    toastService.info({
      title: t('settings.providers.provider_deleted_title'),
      description: t('settings.providers.provider_deleted_description', { providerName: providerToDelete.name }),
    });
  };

  const refreshProviderModels = async (providerToRefresh: Provider) => {
    try {
      // Fetch models specifically for this provider
      const fetchedProviderModels = await fetchAvailableModelsV2([providerToRefresh]);

      // Update the global models list: remove old models for this provider, then add new ones
      setModels(prevModels => [
        ...prevModels.filter(m => m.providerId !== providerToRefresh.id),
        ...fetchedProviderModels,
      ]);

      toastService.success({
        title: t('settings.providers.models_refreshed_title'),
        description: t('settings.providers.models_refreshed_description', { providerName: providerToRefresh.name }),
      });
    } catch (error) {
      console.error(`Error refreshing models for ${providerToRefresh.name}:`, error);
      toastService.danger({
        title: t('settings.providers.failed_to_load_models'),
        description: t('settings.providers.models_fetch_error_specific', { providerName: providerToRefresh.name }),
      });
    }
  };

  return {
    providers,
    models, // Expose models if the component needs direct access, though often it's implicit
    editingProvider,
    isModalVisible,
    openModalToEdit,
    openModalToCreate,
    closeModal,
    saveProvider,
    deleteProvider,
    refreshProviderModels,
  };
};
