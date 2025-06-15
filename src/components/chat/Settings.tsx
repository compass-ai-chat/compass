import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Model, Character, Thread, Provider } from "@/src/types/core";
import { getDefaultStore, useAtom, useAtomValue } from "jotai";
import {
  availableProvidersAtom,
  availableModelsAtom,
  defaultChatDropdownOptionAtom,
  selectedChatDropdownOptionAtom,
  downloadingModelsAtom,
} from "@/src/hooks/atoms";
import { DropdownElement } from "@/src/components/ui/Dropdown";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { toastService } from "@/src/services/toastService";
import { useLocalization } from "@/src/hooks/useLocalization";
import { Modal as UIModal } from "@/src/components/ui/Modal";
import YAML from 'yaml';
import { PREDEFINED_PROVIDERS } from "@/src/constants/providers";
import { getProxyUrl } from "@/src/utils/proxy";
import { fetchAvailableModelsV2 } from "@/src/hooks/useModels";
import Ionicons from '@expo/vector-icons/Ionicons';
import { modalService } from "@/src/services/modalService";

// Extend DropdownElement to include a model property
interface ModelDropdownElement extends DropdownElement {
  model: Model;
}

interface SettingsProps {
    thread: Thread;
    className?: string;
}

type ExportFormat = 'json' | 'yaml';

interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modified_at?: string;
}

interface AvailableModel {
  id: string;
  description?: string;
}

export const Settings: React.FC<SettingsProps> = ({
    thread,
    className,
}) => {

  const [defaultDropdownOption, setDefaultDropdownOption] = useAtom(defaultChatDropdownOptionAtom);
  const { t } = useLocalization();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [selectedDropdownOption, setSelectedDropdownOption] = useAtom(selectedChatDropdownOptionAtom);
  const [providers, setProviders] = useAtom(availableProvidersAtom);
  const [models, setModels] = useAtom(availableModelsAtom);
  const [scanning, setScanning] = useState(false);
  const [ollamaModalVisible, setOllamaModalVisible] = useState(false);
  const [localModels, setLocalModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isPulling, setPulling] = useState<string | null>(null);
  const [downloadingModels, setDownloadingModels] = useAtom(downloadingModelsAtom);

  const recommendedModels: AvailableModel[] = [
    { 
      id: "goekdenizguelmez/JOSIEFIED-Qwen2.5:3b",
      description: "Qwen2.5 with limitations removed"
    },
    { 
      id: "goekdenizguelmez/JOSIEFIED-Qwen3:4b",
      description: "Qwen3 with limitations removed"
    },
    { 
      id: "llama3.2:latest",
      description: "Balanced performance and efficiency"
    },
    { 
      id: "qwen3:4b",
      description: "Balanced performance and efficiency"
    },
    { 
      id: "dengcao/Qwen3-Embedding-0.6B:Q8_0",
      description: "Light multilingual embedding model (100+ languages)"
    }
    
  ];

  const availableSettings = [
    {
      title: t('chats.set_model_as_default'),
      id: "set_model_as_default",
    },
    {
      title: t('chats.export_chat'),
      id: "export_chat",
    },
    {
      title: "Manage Ollama Models",
      id: "manage_ollama",
    },
    {
      title: "Scan for Local Ollama",
      id: "scan_local_ollama",
    },
  ];

  useEffect(() => {
    scanForLocalOllama();
  }, []);

  const scanForLocalOllama = async () => {
    setScanning(true);
    try {

      // return if ollama is already in providers
      if(providers.find(p => p.name === 'Ollama')){
        return;
      }

      const endpoint = "http://localhost:11434";
      const response = await fetch(await getProxyUrl(`${endpoint}/api/version`));
      const data = await response.json();
      
      if (data && data.version) {
        // Check if provider already exists
        const existingProvider = providers.find(p => p.endpoint === endpoint);
        if (!existingProvider) {
          const newProvider: Provider = {
            ...PREDEFINED_PROVIDERS.ollama,
            id: Date.now().toString(),
          };
          
          await setProviders([...providers, newProvider]);
          
          // Fetch models for the new provider
          const modelsFound = await fetchAvailableModelsV2([newProvider]);
          
          if(modelsFound.length ==0 ){
            const answer = await modalService.confirm({
              title: "Let's get you started",
              message: "Want to install a recommended model? This will pull the model to your local Ollama instance.",
            });
            if(answer){
              pullModel(recommendedModels[0].id);
            }
          }
          
          
          toastService.success({
            title: "Local Ollama Found",
            description: "Successfully connected to local Ollama instance",
          });
        } else {
          toastService.info({
            title: "Local Ollama Already Added",
            description: "Local Ollama instance is already in your providers list",
          });
        }
      }
    } catch (error) {
      console.error("Error scanning for local Ollama:", error);
      toastService.danger({
        title: "Local Ollama Not Found",
        description: "Could not connect to local Ollama instance at http://localhost:11434",
      });
    } finally {
      setScanning(false);
    }
  };

  const fetchLocalModels = async () => {
    setIsLoadingModels(true);
    try {
      const ollamaProvider = providers.find(p => p.name === 'Ollama');
      if (!ollamaProvider) {
        throw new Error('No Ollama provider found');
      }
      const response = await fetch(await getProxyUrl(`${ollamaProvider.endpoint}/api/tags`));
      const data = await response.json();
      if (data && Array.isArray(data.models)) {
        setLocalModels(data.models);
      }
    } catch (error: any) {
      console.error("Error fetching local models:", error);
      toastService.danger({
        title: 'Failed to fetch models',
        description: error.message
      });
    } finally {
      setIsLoadingModels(false);
      const updatedDownloadingModels = await getDefaultStore().get(downloadingModelsAtom);
      // check if any models are now downloaded and should be removed from downloadingModels or have a startTime older than 30 minutes
      setDownloadingModels(updatedDownloadingModels.filter(m => !localModels.some(local => local.name.includes(m.modelId)) || m.startTime < Date.now() - 30 * 60 * 1000));

      // if any models are still downloading, then set as pulling
      setPulling(updatedDownloadingModels.map(m => m.modelId).join(','));
    }
  };

  const pullModel = async (modelId: string) => {
    setPulling(modelId);
    try {
      const updatedProviders = await getDefaultStore().get(availableProvidersAtom);
      const ollamaProvider = updatedProviders.find(p => p.name === 'Ollama');
      console.log("providers", updatedProviders);
      if (!ollamaProvider) {
        throw new Error('No Ollama provider found');
      }
      fetch(await getProxyUrl(`${ollamaProvider.endpoint}/api/pull`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelId,
          stream: false
        })
      });
      let updatedDownloadingModels = await getDefaultStore().get(downloadingModelsAtom);
      await setDownloadingModels([...updatedDownloadingModels, { modelId, startTime: Date.now() }]);
      updatedDownloadingModels = await getDefaultStore().get(downloadingModelsAtom);
      toastService.success({
        title: 'Model download started',
        description: `${modelId} is being downloaded in the background`
      });
      fetchLocalModels();
    } catch (error: any) {
      toastService.danger({
        title: 'Failed to pull model',
        description: error.message
      });
    } finally {
      setPulling(null);
    }
  };

  const deleteModel = async (modelName: string) => {
    try {
      const ollamaProvider = providers.find(p => p.name === 'Ollama');
      if (!ollamaProvider) {
        throw new Error('No Ollama provider found');
      }
      await fetch(await getProxyUrl(`${ollamaProvider.endpoint}/api/delete`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName })
      });
      toastService.success({
        title: 'Model deleted',
        description: `${modelName} has been removed`
      });
      fetchLocalModels();
    } catch (error: any) {
      toastService.danger({
        title: 'Failed to delete model',
        description: error.message
      });
    }
  };

  const handleSettingSelect = (el: DropdownElement)=>{
    if(el.id == "set_model_as_default"){
        setCurrentModelAsDefault();
    } else if (el.id === "export_chat") {
      setExportModalVisible(true);
    } else if (el.id === "scan_local_ollama") {
      scanForLocalOllama();
    } else if (el.id === "manage_ollama") {
      setOllamaModalVisible(true);
      fetchLocalModels();
    }
  };

  function setCurrentModelAsDefault() {
    if (selectedDropdownOption) {
      setDefaultDropdownOption(selectedDropdownOption);
      toastService.success({
        title: t('chats.default_model_set'),
        description: t('chats.selected_model_will_now_be_used_for_new_threads'),
      });
    }
  }

  const exportData = async () => {
    const filename = `compass-chat-${thread.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    let exportContent: string;

    // Prepare the data to export
    const exportData = {
      title: thread.title,
      id: thread.id,
      messages: thread.messages,
      selectedModel: thread.selectedModel,
      timestamp: new Date().toISOString(),
    };

    switch (selectedFormat) {
      case 'json':
        exportContent = JSON.stringify(exportData, null, 2);
        downloadFile(`${filename}.json`, exportContent, 'application/json');
        break;
      case 'yaml':
        exportContent = YAML.stringify(exportData);
        downloadFile(`${filename}.yaml`, exportContent, 'application/yaml');
        break;
    }

    setExportModalVisible(false);
    toastService.success({
      title: t('chats.export_successful'),
      description: t('chats.chat_exported_successfully'),
    });
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For mobile platforms, we would need to implement
      // platform-specific file saving logic or use a library
      toastService.info({
        title: t('chats.export_mobile_not_supported'),
        description: t('chats.export_mobile_not_supported_description'),
      });
    }
  };

  const FormatButton = ({ format }: { format: ExportFormat }) => (
    <TouchableOpacity
      onPress={() => setSelectedFormat(format)}
      className={`flex-1 p-4 m-2 rounded-lg border-2 ${
        selectedFormat === format ? 'border-primary bg-primary/10' : 'border-border bg-surface'
      }`}
    >
      <Text className={`text-lg font-semibold text-center ${
        selectedFormat === format ? 'text-primary' : 'text-text'
      }`}>
        {format.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-row gap-2 items-center ${className}`}>
      <Dropdown
        iconOpen="ellipsis-horizontal"
        iconClosed="ellipsis-horizontal"
        showSearch={false}
        selected={undefined}
        onSelect={handleSettingSelect}
        children={availableSettings}
        className={`max-w-48 overflow-hidden bg-surface border-none`}
        position="right"
      />

      <UIModal isVisible={exportModalVisible} onClose={() => setExportModalVisible(false)}>
        <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 30 }}>
          <View className="mb-6">
            <Text className="text-xl font-bold text-text mb-4">
              {t('chats.export_chat')}
            </Text>
            
            <Text className="text-secondary mb-6">
              {t('chats.export_chat_description')}
            </Text>

            <Text className="text-lg font-semibold text-text mb-4">
              {t('chats.select_export_format')}:
            </Text>
            
            <View className="flex-row mb-6">
              <FormatButton format="json" />
              <FormatButton format="yaml" />
            </View>
          </View>
        </ScrollView>
        
        <View className="flex-row space-x-4 mt-6 m-2">
          <TouchableOpacity
            onPress={() => setExportModalVisible(false)}
            className="flex-1 p-4 rounded-lg bg-background mr-2"
          >
            <Text className="text-center text-text">
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exportData}
            className="flex-1 p-4 rounded-lg bg-primary"
          >
            <Text className="text-center text-white">
              {t('chats.export')}
            </Text>
          </TouchableOpacity>
        </View>
      </UIModal>

      <UIModal isVisible={ollamaModalVisible} onClose={() => setOllamaModalVisible(false)}>
        <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 30 }}>
          <View className="mb-6">
            <Text className="text-xl font-bold text-text mb-4">
              Manage Ollama Models
            </Text>
            
            <Text className="text-secondary mb-6">
              Install and manage your local Ollama models
            </Text>

            <Text className="text-lg font-semibold text-text mb-4">
              Installed Models
            </Text>
            
            {isLoadingModels ? (
              <ActivityIndicator size="large" className="my-4" />
            ) : (
              <View className="mb-6">
                {localModels.map((model) => (
                  <View key={model.digest} className="bg-surface p-4 rounded-lg mb-2 border border-border">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="font-medium text-text">{model.name}</Text>
                        <Text className="text-sm text-secondary">
                          Size: {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteModel(model.name)}
                        className="bg-red-500/10 p-2 rounded-lg"
                      >
                        <Ionicons name="trash" size={20} className="text-red-500" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text className="text-lg font-semibold text-text mb-4">
              Recommended Models
            </Text>
            
            <View>
              {recommendedModels
                .filter(model => !localModels.some(local => local.name.includes(model.id)))
                .map((model) => (
                <View key={model.id} className="bg-surface p-4 rounded-lg mb-2 border border-border">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                      <Text className="font-medium text-text">{model.id}</Text>
                      {model.description && (
                        <Text className="text-sm text-secondary">{model.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => pullModel(model.id)}
                      disabled={isPulling === model.id}
                      className="bg-primary/10 p-2 rounded-lg"
                    >
                      {isPulling && isPulling.split(',').includes(model.id) ? (
                        <ActivityIndicator size="small" className="text-primary" />
                      ) : (
                        <Ionicons name="download" size={20} className="text-primary" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View className="flex-row justify-end space-x-4 mt-6 m-2">
          <TouchableOpacity
            onPress={() => setOllamaModalVisible(false)}
            className="px-6 py-3 rounded-lg bg-background"
          >
            <Text className="text-center text-text">
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </UIModal>
    </View>
  );
};
