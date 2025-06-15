import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { downloadingModelsAtom, availableProvidersAtom } from '@/src/hooks/atoms';
import { getProxyUrl } from '@/src/utils/proxy';
import { toastService } from '@/src/services/toastService';

interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modified_at?: string;
}

export const useModelDownloadStatus = () => {
  const [downloadingModels, setDownloadingModels] = useAtom(downloadingModelsAtom);
  const [providers] = useAtom(availableProvidersAtom);

  useEffect(() => {
    if (downloadingModels.length === 0) return;

    const checkModelStatus = async () => {
      try {
        const ollamaProvider = providers.find(p => p.name === 'Ollama');
        if (!ollamaProvider) return;

        const response = await fetch(await getProxyUrl(`${ollamaProvider.endpoint}/api/tags`));
        const data = await response.json();
        
        if (data && Array.isArray(data.models)) {
          const localModels = data.models as OllamaModel[];
          
          // Filter out models that are now downloaded or have been downloading for too long (30 minutes)
          const updatedDownloadingModels = downloadingModels.filter(model => {
            const isDownloaded = localModels.some(local => local.name.includes(model.modelId));
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