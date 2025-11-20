import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useEffect, useState } from "react";
import { Provider } from "@/src/types/core";
import { PREDEFINED_PROVIDERS } from "@/src/constants/providers";
import { ProviderFormFields } from "./ProviderFormFields";
import { PROVIDER_LOGOS } from "@/src/constants/logos";
import { Modal } from "@/src/components/ui/Modal";
import { EditOllama } from "./EditOllama";
import { toastService } from "@/src/services/toastService";
import { useLocalization } from "@/src/hooks/useLocalization";

interface EndpointModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (provider: Provider) => void;
  initialProvider?: Provider;
  initialCapabilityFilter?: keyof Provider['capabilities'];
}

export function EndpointModal({
  visible,
  onClose,
  onSave,
  initialProvider,
  initialCapabilityFilter,
}: EndpointModalProps) {
  const { t } = useLocalization();
  const [formData, setFormData] = useState<Omit<Provider, 'id'>>({
    name: PREDEFINED_PROVIDERS.ollama.name,
    endpoint: PREDEFINED_PROVIDERS.ollama.endpoint,
    apiKey: '',
    capabilities: PREDEFINED_PROVIDERS.ollama.capabilities,
    logo: PREDEFINED_PROVIDERS.ollama.logo,
  });

  useEffect(() => {
    if (visible) {
      if (!initialProvider && initialCapabilityFilter) {
        const defaultProvider = Object.values(PREDEFINED_PROVIDERS).find(
          p => p.capabilities?.[initialCapabilityFilter]
        ) || PREDEFINED_PROVIDERS.ollama;
        
        setFormData({
          name: defaultProvider.name,
          endpoint: defaultProvider.endpoint,
          apiKey: '',
          capabilities: defaultProvider.capabilities,
          logo: defaultProvider.logo,
        });
      } else {
        setFormData(initialProvider ?? {
          name: PREDEFINED_PROVIDERS.ollama.name,
          endpoint: PREDEFINED_PROVIDERS.ollama.endpoint,
          apiKey: '',
          capabilities: PREDEFINED_PROVIDERS.ollama.capabilities,
          logo: PREDEFINED_PROVIDERS.ollama.logo,
        });
      }
    }
  }, [visible, initialProvider, initialCapabilityFilter]);

  const handleSave = () => {
    console.log("formData", formData);
    if (formData.name?.trim() === '') {
      toastService.danger({
        title: 'Name Required',
        description: 'Please enter a name for this provider.',
      });
      return;
    }

    if (formData.keyRequired && !formData.apiKey) {
      toastService.danger({
        title: 'API Key Required',
        description: 'Please enter an API key for this provider.',
      });
      return;
    }

    onSave({
      id: initialProvider?.id ?? Date.now().toString(),
      ...formData,
    });
  };

  const isOllama = formData.name?.toLowerCase().includes('ollama');

  return (
    <Modal isVisible={visible} onClose={onClose} maxHeight="85%">
      <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="flex-row items-center mb-6">
          {formData.logo && (
            <Image
              source={{ uri: formData.logo }}
              className="w-[48px]! h-[48px]! rounded-full mr-3"
            />
          )}
          <Text className="text-xl font-bold text-text">
            {initialProvider ? "Edit Provider" : "Add Provider"}
          </Text>
        </View>

        <ProviderFormFields
          formData={formData}
          onChange={(updates) => {
            setFormData(prev => ({ ...prev, ...updates }));
          }}
          onAuthSuccess={(token) => {
            handleSave();
          }}
          initialCapabilityFilter={initialCapabilityFilter}
        />

        {/* {isOllama && initialProvider && false && (
          <EditOllama provider={initialProvider} />
        )} */}
      </ScrollView>
      
      <View className="flex-row space-x-4 mt-6 m-2">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 p-4 rounded-lg bg-background mr-2"
        >
          <Text className="text-center text-text">
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          className="flex-1 p-4 rounded-lg bg-primary"
        >
          <Text className="text-center text-white">{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
