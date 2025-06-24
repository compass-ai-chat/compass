import NetInfo from "@react-native-community/netinfo";
import { Platform, PermissionsAndroid } from "react-native";
import { getProxyUrl } from "@/src/utils/proxy";

export async function scanLocalOllama(): Promise<string[]> {
  const localEndpoints = ["http://localhost:11434"];

  const testEndpoint = async (endpoint: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      const response = await fetch(await getProxyUrl(endpoint + "/"), { // Check root
        headers: {
          Accept: "text/plain",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const responseText = await response.text();
        if (responseText.toLowerCase().includes("ollama is running")) {
          return endpoint;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const results = await Promise.all(localEndpoints.map(testEndpoint));
  return results.filter((result) => result !== null) as string[];
}

export async function scanNetworkOllama(): Promise<string[]> {
  const networkState = await NetInfo.fetch();
  const networkPatterns: string[] = [];

  if (
    networkState.type === "wifi" &&
    networkState.details?.ipAddress &&
    networkState.details?.subnet
  ) {
    const ipAddress = networkState.details.ipAddress;
    const subnetMask = networkState.details.subnet;
    const ipParts = ipAddress.split('.');

    // Basic /24 subnet assumption
    if (ipParts.length === 4) {
        const subnetBase = ipParts.slice(0, 3).join(".");
        for (let i = 1; i <= 254; i++) {
          networkPatterns.push(`http://${subnetBase}.${i}:11434`);
        }
    } else { // Fallback if IP structure is not as expected
        ["192.168.0", "192.168.1", "10.0.0"].forEach(subnetBase => {
            for (let i = 1; i <= 254; i++) networkPatterns.push(`http://${subnetBase}.${i}:11434`);
        });
    }
  } else {
    ["192.168.0", "192.168.1", "10.0.0"].forEach(subnetBase => { // Common fallbacks
        for (let i = 1; i <= 254; i++) networkPatterns.push(`http://${subnetBase}.${i}:11434`);
    });
  }

  const BATCH_SIZE = 25;
  const TIMEOUT_MS = 750;

  const testEndpoint = async (endpoint: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(await getProxyUrl(endpoint + "/"), { // Check root
        headers: {
          Accept: "text/plain",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const responseText = await response.text();
        if (responseText.toLowerCase().includes("ollama is running")) {
          return endpoint;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  let discoveredEndpoints: string[] = [];
  for (let i = 0; i < networkPatterns.length; i += BATCH_SIZE) {
    const batch = networkPatterns.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(testEndpoint));
    discoveredEndpoints = [...discoveredEndpoints, ...batchResults.filter((result) => result !== null) as string[]];
  }

  const uniqueEndpoints = Array.from(new Set(discoveredEndpoints));
  const localhostEndpoint = "http://localhost:11434";
  if (uniqueEndpoints.includes(localhostEndpoint)) {
    return [localhostEndpoint, ...uniqueEndpoints.filter(ep => ep !== localhostEndpoint)];
  }
  return uniqueEndpoints;
}

export async function requestLocationPermissionForAndroid(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Fine Location Permission for Network Scan",
          message:
            "The app needs access to your location to discover Ollama instances on your local network. " +
            "This is a requirement by Android for apps that scan Wi-Fi networks.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Location permission request error:", err);
      return false;
    }
  }
  return true; // Not Android, permission not typically required in the same way
}
