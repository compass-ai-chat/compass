import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { downloadingModelsAtom, availableProvidersAtom, availableModelsAtom,  } from '@/src/hooks/atoms';
import { getProxyUrl } from '@/src/utils/proxy';
import { toastService } from '@/src/services/toastService';
import { fetchAvailableModelsV2 } from './useModels';

interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modified_at?: string;
}

export const useModelDownloadStatus = () => {
  const [downloadingModels, setDownloadingModels] = useAtom(downloadingModelsAtom);
  const [providers] = useAtom(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom);
  useEffect(() => {
    if (downloadingModels.length === 0) return;

    const checkModelStatus = async () => {
      try {
        const ollamaProvider = providers.find(p => p.name === 'Ollama');
        if (!ollamaProvider) return;

        const modelsFound = await fetchAvailableModelsV2([ollamaProvider]);
        setModels([...models, ...modelsFound]);
        
        if (modelsFound && Array.isArray(modelsFound)) {
          
          // Filter out models that are now downloaded or have been downloading for too long (30 minutes)
          const updatedDownloadingModels = downloadingModels.filter(model => {
            const isDownloaded = models.some(local => local.id === model.modelId);
            const isTooOld = model.startTime < Date.now() - 30 * 60 * 1000;
            
            // If model is downloaded, show success toast
            if (isDownloaded) {
              toastService.success({
                title: 'Model downloaded',
                description: `${model.modelId} has been successfully downloaded`
              });
            }
            
            // If model is too old, show error toast
            if (isTooOld) {
              toastService.danger({
                title: 'Download timeout',
                description: `${model.modelId} download timed out after 30 minutes`
              });
            }
            
            return !isDownloaded && !isTooOld;
          });

          setDownloadingModels(updatedDownloadingModels);
        }
      } catch (error) {
        console.error('Error checking model status:', error);
      }
    };

    // Check immediately
    checkModelStatus();

    // Then check every 10 seconds
    const interval = setInterval(checkModelStatus, 10000);

    return () => clearInterval(interval);
  }, [downloadingModels, providers, setDownloadingModels]);
}; 