import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getDefaultStore, useAtom } from "jotai";
import { useLocalization } from "@/src/hooks/useLocalization";
import {
  availableProvidersAtom,
  logsAtom,   
  availableModelsAtom,
} from "@/src/hooks/atoms";
import { ProviderCard } from "@/src/components/providers/ProviderCard";
import { EndpointModal } from "@/src/components/providers/EndpointModal";
import { useState } from "react";
import { Provider } from "@/src/types/core";
import NetInfo from "@react-native-community/netinfo";
import LogService from "@/utils/LogService";
import { fetchAvailableModelsV2 } from "@/src/hooks/useModels";
import { toastService } from "@/src/services/toastService";
import { EditOllama } from "./EditOllama";
import { router } from "expo-router";
import { getProxyUrl } from "@/src/utils/proxy";
import { MicrosoftAuthModal } from "./MicrosoftAuthModal";
import { SignInButton } from "@/src/components/auth/SignInButton";
import { isSSOEnabled } from "@/src/config/sso";

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
                  id: endpoint,
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

        {/* SSO Sign-In Section */}
        {isSSOEnabled() && (
          <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
            <View className="flex-row items-center mb-2">
              <Ionicons name="key-outline" size={20} className="!text-primary mr-2" />
              <Text className="text-text font-medium">Quick Sign In</Text>
            </View>
            <Text className="text-secondary text-sm mb-3">
              Sign in to automatically configure your AI provider
            </Text>
            <SignInButton />
          </View>
        )}

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

export async function scanLocalOllama(): Promise<string[]> {
  const localEndpoints = ["http://localhost:11434"];

  const testEndpoint = async (endpoint: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      const response = await fetch(await getProxyUrl(endpoint), {
        headers: {
          Accept: "application/text",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.status === 200 ? endpoint : null;
    } catch (error) {
      return null;
    }
  };

  const results = await Promise.all(localEndpoints.map(testEndpoint));
  return results.filter((result) => result !== null) as string[];
}

export async function scanNetworkOllama(): Promise<string[]> {
  // Get network info
  const networkState = await NetInfo.fetch();
  const networkPatterns: string[] = [];

  if (
    networkState.type === "wifi" &&
    networkState.details?.ipAddress &&
    networkState.details?.subnet
  ) {
    // Extract subnet from IP and subnet mask
    const subnet = networkState.details.ipAddress
      .split(".")
      .slice(0, 3)
      .join(".");
    // Generate IPs only for the detected subnet
    for (let i = 1; i <= 254; i++) {
      networkPatterns.push(`http://${subnet}.${i}:11434`);
    }
  } else {
    // Fallback to checking common subnets if we can't determine the current network
    for (let i = 1; i <= 254; i++) {
      networkPatterns.push(`http://192.168.0.${i}:11434`);
    }
    for (let i = 1; i <= 254; i++) {
      networkPatterns.push(`http://192.168.1.${i}:11434`);
    }
  }

  // Batch size of concurrent requests
  const BATCH_SIZE = 25;
  const TIMEOUT_MS = 500;

  // Modified test endpoint function that resolves as soon as a valid endpoint is found
  const testEndpoint = async (endpoint: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(await getProxyUrl(endpoint), {
        headers: {
          Accept: "application/text",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.status === 200 ? endpoint : null;
    } catch (error: any) {
      return null;
    }
  };

  let results: string[] = [];
  // Process endpoints in batches
  for (let i = 0; i < networkPatterns.length; i += BATCH_SIZE) {
    const batch = networkPatterns.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(testEndpoint));
    results = [...results, ...batchResults.filter((result) => result !== null)];
  }

  // if we have both localhost and 127.0.0.1, remove 127.0.0.1
  if (
    results.includes("localhost:11434") &&
    results.includes("127.0.0.1:11434")
  ) {
    results = results.filter((result) => !result.includes("127.0.0.1:11434"));
  }

  if (results.length > 1 && results.includes("localhost:11434")) {
    // make request to /api/tags
    const localResponse = await fetch(
      await getProxyUrl(`http://localhost:11434/api/tags`),
    );
    const localData = await localResponse.json();

    const otherEndpoints = results.filter(
      (result) => !result.includes("localhost:11434"),
    );
    for (let i = 0; i < otherEndpoints.length; i++) {
      const response = await fetch(
        await getProxyUrl(`${otherEndpoints[i]}/api/tags`),
      );
      const responseData = await response.json();
      if (localData.toString() == responseData.toString()) {
        results = results.filter((result) => result != otherEndpoints[i]);
      }
    }
  }

  return results;
}
