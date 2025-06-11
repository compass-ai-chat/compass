import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { Model, Character, Thread, Provider } from "@/src/types/core";
import { getDefaultStore, useAtom, useAtomValue } from "jotai";
import {
  availableProvidersAtom,
  availableModelsAtom,
  defaultChatDropdownOptionAtom,
  selectedChatDropdownOptionAtom,
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

// Extend DropdownElement to include a model property
interface ModelDropdownElement extends DropdownElement {
  model: Model;
}

interface SettingsProps {
    thread: Thread;
    className?: string;
}

type ExportFormat = 'json' | 'yaml';

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
      title: "Scan for Local Ollama",
      id: "scan_local_ollama",
    },
  ];

  const scanForLocalOllama = async () => {
    setScanning(true);
    try {
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
          setModels([...models, ...modelsFound]);
          
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

  const handleSettingSelect = (el: DropdownElement)=>{
    if(el.id == "set_model_as_default"){
        setCurrentModelAsDefault();
    } else if (el.id === "export_chat") {
      setExportModalVisible(true);
    } else if (el.id === "scan_local_ollama") {
      scanForLocalOllama();
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
    </View>
  );
};
