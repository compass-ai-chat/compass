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
// Provider type is used by ProviderCard and EndpointModal, but not directly here after refactor
// import { Provider } from "@/src/types/core";
import { useOllamaScan } from "@/src/hooks/useOllamaScan";
import { useProviderManagement } from "@/src/hooks/useProviderManagement";
import { availableProvidersAtom } from "@/src/hooks/atoms"; // Import the atom
import { useAtom } from "jotai"; // Import useAtom to get setProviders

interface ProvidersProps {
  className?: string;
}

export default function Providers({ className }: ProvidersProps) {
  const { t } = useLocalization();

  const {
    providers,
    editingProvider,
    isModalVisible,
    openModalToEdit,
    openModalToCreate,
    closeModal,
    saveProvider,
    deleteProvider,
    refreshProviderModels,
  } = useProviderManagement();

  // Get setProviders directly from the atom for useOllamaScan
  // This decouples useOllamaScan from needing setProviders from useProviderManagement explicitly
  const [, setProvidersAtomDirectly] = useAtom(availableProvidersAtom);

  const { scanning, autoScanForOllama } = useOllamaScan({
    providers,
    setProviders: setProvidersAtomDirectly // Pass the atom's setter directly
  });

  return (
    <View className={`flex-1 ${className}`}>
      {/* Header Section - Could be a separate component e.g., ProvidersHeader */}
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
