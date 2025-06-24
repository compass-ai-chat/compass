import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalization } from "@/src/hooks/useLocalization";
import { ProviderCard } from "@/src/components/providers/ProviderCard";
import { EndpointModal } from "@/src/components/providers/EndpointModal";
// Provider type is used by ProviderCard and EndpointModal if they expect it,
// but the main Providers component doesn't need to import Provider directly anymore.
// import { Provider } from "@/src/types/core";
import { useOllamaScan } from "@/src/hooks/useOllamaScan";
import { useProviderManagement } from "@/src/hooks/useProviderManagement";

interface ProvidersProps {
  className?: string;
}

export default function Providers({ className }: ProvidersProps) {
  const { t } = useLocalization();
  const [providers, setProviders] = useAtom(availableProvidersAtom);
  const [logs, setLogs] = useAtom(logsAtom);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(
    undefined,
  );
  const [scanning, setScanning] = useState(false);
  const [models, setModels] = useAtom(availableModelsAtom);

  const handleAuthSuccess = async () => {
    // Refresh providers and models after successful authentication
    alert("Auth success");
  };

  const handleSave = async (provider: Provider) => {
    if (editingProvider) {
      const updated = providers.map((e) =>
        e.id === editingProvider.id ? provider : e,
      );
      await setProviders(updated);
    } else {
      await setProviders([
        ...providers,
        { ...provider, id: Date.now().toString() },
      ]);
    }
    setEditingProvider(undefined);
    setShowModal(false);

    fetchAvailableModelsV2(
      await getDefaultStore().get(availableProvidersAtom),
    ).then((modelsFound) => {
      setModels(modelsFound);
    });

    toastService.success({
      title: t("settings.providers.provider_saved"),
      description: t("settings.providers.provider_saved_description"),
    });
  };

  const handleDelete = async (provider: Provider) => {
    const updated = providers.filter((e) => e.id !== provider.id);
    setProviders(updated);
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    console.log("editing provider", provider);
    setShowModal(true);
  };

  const handleRefresh = (provider: Provider) => {
    fetchAvailableModelsV2([provider])
      .then((fetchedModels) => {
        setModels(fetchedModels);
      })
      .catch((error) => {
        console.error("Error fetching models:", error);
        toastService.danger({
          title: t("settings.providers.failed_to_load_models"),
          description: t("settings.providers.models_fetch_error"),
        });
      })
      .finally(() => {});
  };

  const autoScanForOllama = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Fine Location Permission",
          message:
            "Compass needs access to your location " +
            "so it can scan for Ollama instances on your network.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Location permission granted");
      } else {
        console.log("Location permission denied");
      }
    }

    setScanning(true);
    try {
      scanNetworkOllama()
        .then((ollamaEndpoints) => {
          const newProviders: Provider[] = ollamaEndpoints
            .map(
              (endpoint) =>
                ({
                  endpoint,
                  id: Date.now().toString() + endpoint,
                  name: "Ollama",
                  capabilities: {
                    llm: true,
                    tts: false,
                    stt: false,
                    search: false,
                  },
                }) as Provider,
            )
            .filter(
              (p) =>
                providers.find((e) => e.endpoint === p.endpoint) === undefined,
            );

          if (newProviders.length > 0) {
            setProviders([...providers, ...newProviders]);
            console.log("Provider added");
            toastService.success({
              title: "Provider added",
              description: `${newProviders.length} new Ollama instances were found`,
            });
          } else {
            toastService.info({
              title: "No new Ollama instances found",
              description:
                "Couldn't find any new Ollama instances on your network",
            });
          }
        })
        .finally(() => {
          setScanning(false);
        });
    } catch (error) {
      console.error(error);
      setScanning(false);
    }
  };

  return (
    <View className={`flex-1 ${className}`}>
      <ScrollView className="p-4" contentContainerStyle={{ flexGrow: 0 }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center p-4">
            <Ionicons
              name="git-branch"
              size={32}
              className="!text-primary mr-2 pb-2"
            />
            <Text className="text-2xl font-bold text-primary">{t("settings.providers.providers")}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingProvider(undefined);
              setShowModal(true);
            }}
            className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">{t("settings.providers.add_provider")}</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center py-2">
          <Ionicons
            name="information-circle-outline"
            size={20}
            className="!text-primary mr-2"
          />
          <Text className="text-text flex-1 font-medium pt-1">
            {t("settings.providers.detailed_description")}
          </Text>
        </View>

        <View className="md:gap-4 gap-2 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider, index) => (
            <View key={provider.id} className="w-full">
              <ProviderCard
                className="bg-surface rounded-xl shadow-lg"
                provider={provider}
                onRefresh={handleRefresh}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 mb-6">
        <TouchableOpacity
          className="flex-row items-center justify-center bg-primary rounded-lg p-4"
          onPress={autoScanForOllama}
        >
          <Ionicons
            name="scan-outline"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text className="text-white text-lg font-semibold">
            {scanning ? t("settings.providers.scanning_for_ollama") : t("settings.providers.auto_detect_ollama")}
          </Text>
          {scanning && (
            <ActivityIndicator
              size="small"
              color="white"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
          {t("settings.providers.auto_detect_description")}
        </Text>
      </View>

      <EndpointModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProvider(undefined);
        }}
        onSave={handleSave}
        initialProvider={editingProvider}
      />
    </View>
  );
}

// scanLocalOllama and scanNetworkOllama functions are now in ollamaDiscoveryService.ts
