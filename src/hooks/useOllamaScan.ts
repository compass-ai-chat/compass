import { useState } from 'react';
import { useAtom } from 'jotai';
import { Provider } from '@/src/types/core';
import { scanNetworkOllama, requestLocationPermissionForAndroid, scanLocalOllama } from '@/src/services/ollamaDiscoveryService';
import { toastService } from '@/src/services/toastService';
import { useLocalization } from '@/src/hooks/useLocalization';
import { availableProvidersAtom } from '@/src/hooks/atoms'; // Import atom

export const useOllamaScan = () => { // Removed props, will use atom internally
  const { t } = useLocalization();
  const [providers, setProviders] = useAtom(availableProvidersAtom); // Use atom directly
  const [scanning, setScanning] = useState(false);
  // const [scannedEndpoints, setScannedEndpoints] = useState<string[]>([]); // Internal state, might not be needed by consuming component

  const autoScanForOllama = async (scanType: 'network' | 'local' = 'network') => {
    const permissionGranted = await requestLocationPermissionForAndroid();
    if (!permissionGranted && scanType === 'network') {
      toastService.info({
        title: t('settings.providers.permission_denied_title', {defaultValue: "Permission Denied"}),
        description: t('settings.providers.permission_denied_description', {defaultValue: "Location permission is needed to scan the network."}),
      });
      return;
    }

    setScanning(true);
    // setScannedEndpoints([]);

    try {
      let ollamaEndpoints: string[] = [];
      if (scanType === 'network') {
        ollamaEndpoints = await scanNetworkOllama();
      } else {
        ollamaEndpoints = await scanLocalOllama();
      }

      // setScannedEndpoints(ollamaEndpoints);

      const newProviders: Provider[] = ollamaEndpoints
        .map((endpoint) => ({
          endpoint,
          id: Date.now().toString() + endpoint + Math.random().toString(36).substring(2, 15), // More robust unique ID
          name: 'Ollama',
          capabilities: { llm: true, tts: false, stt: false, search: false },
        } as Provider))
        .filter((p) => !providers.find((e) => e.endpoint === p.endpoint)); // providers from atom

      if (newProviders.length > 0) {
        setProviders((prevProviders) => [...prevProviders, ...newProviders]); // setProviders from atom
        toastService.success({
          title: t('settings.providers.ollama_instances_found_title', {defaultValue: "Ollama Instances Found"}),
          description: t('settings.providers.ollama_instances_found_description', { count: newProviders.length, defaultValue: `${newProviders.length} new Ollama instance(s) were found and added.` }),
        });
      } else {
        toastService.info({
          title: t('settings.providers.no_new_ollama_title', {defaultValue: "No New Ollama Instances"}),
          description: t('settings.providers.no_new_ollama_description', {defaultValue: "No new Ollama instances were found on your network."}),
        });
      }
    } catch (error) {
      console.error(`Error scanning for Ollama (${scanType}):`, error);
      toastService.danger({
        title: t('settings.providers.scan_error_title', {defaultValue: "Scan Error"}),
        description: t('settings.providers.scan_error_description', {defaultValue: "An error occurred while scanning for Ollama instances."}),
      });
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    autoScanForOllama,
    // scannedEndpoints, // Expose if needed by UI, for now it's internal
  };
};
