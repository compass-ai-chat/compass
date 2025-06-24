import { useState } from 'react';
import { Provider } from '@/src/types/core';
import { scanNetworkOllama, requestLocationPermissionForAndroid, scanLocalOllama } from '@/src/services/ollamaDiscoveryService';
import { toastService } from '@/src/services/toastService';
import { useLocalization } from '@/src/hooks/useLocalization';

interface UseOllamaScanProps {
  providers: Provider[];
  setProviders: (providers: Provider[] | ((prevProviders: Provider[]) => Provider[])) => void;
}

export const useOllamaScan = ({ providers, setProviders }: UseOllamaScanProps) => {
  const { t } = useLocalization();
  const [scanning, setScanning] = useState(false);
  const [scannedEndpoints, setScannedEndpoints] = useState<string[]>([]);

  const autoScanForOllama = async (scanType: 'network' | 'local' = 'network') => {
    const permissionGranted = await requestLocationPermissionForAndroid();
    if (!permissionGranted && scanType === 'network') { // Permission primarily for network scan
      toastService.info({
        title: t('settings.providers.permission_denied_title'),
        description: t('settings.providers.permission_denied_description'),
      });
      return;
    }

    setScanning(true);
    setScannedEndpoints([]); // Reset previous scan results

    try {
      let ollamaEndpoints: string[] = [];
      if (scanType === 'network') {
        ollamaEndpoints = await scanNetworkOllama();
      } else {
        ollamaEndpoints = await scanLocalOllama();
      }

      setScannedEndpoints(ollamaEndpoints);

      const newProviders: Provider[] = ollamaEndpoints
        .map((endpoint) => ({
          endpoint,
          id: Date.now().toString() + endpoint + Math.random(), // Ensure unique ID
          name: 'Ollama', // Default name
          capabilities: { llm: true, tts: false, stt: false, search: false },
        } as Provider))
        .filter((p) => !providers.find((e) => e.endpoint === p.endpoint));

      if (newProviders.length > 0) {
        setProviders((prevProviders) => [...prevProviders, ...newProviders]);
        toastService.success({
          title: t('settings.providers.ollama_instances_found_title'),
          description: t('settings.providers.ollama_instances_found_description', { count: newProviders.length }),
        });
      } else {
        toastService.info({
          title: t('settings.providers.no_new_ollama_title'),
          description: t('settings.providers.no_new_ollama_description'),
        });
      }
    } catch (error) {
      console.error(`Error scanning for Ollama (${scanType}):`, error);
      toastService.danger({
        title: t('settings.providers.scan_error_title'),
        description: t('settings.providers.scan_error_description'),
      });
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    autoScanForOllama,
    scannedEndpoints, // Exposing this can be useful for UI feedback
  };
};
