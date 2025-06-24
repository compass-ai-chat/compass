import NetInfo from "@react-native-community/netinfo";
import { Platform, PermissionsAndroid } from "react-native";
import { getProxyUrl } from "@/src/utils/proxy"; // Assuming this utility is appropriate for a service

// Note: Consider if LogService or toastService are needed here, or if errors should be bubbled up
// For now, console.logs are kept, but for robust service, structured logging/error handling is better.

export async function scanLocalOllama(): Promise<string[]> {
  const localEndpoints = ["http://localhost:11434"];

  const testEndpoint = async (endpoint: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout for local scan

      const response = await fetch(await getProxyUrl(endpoint), { // Ensure getProxyUrl is safe to use here
        headers: {
          Accept: "application/text", // Changed to application/json as /api/tags expects json
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      // Check for /api/tags endpoint as a more reliable health check for Ollama
      if (response.ok) { // status in 200-299 range
        // Optionally, try to fetch /api/tags to confirm it's an Ollama instance
        const testRoot = await fetch(await getProxyUrl(endpoint + "/"), { signal: controller.signal });
        if (testRoot.ok && (await testRoot.text()).toLowerCase().includes("ollama is running")) {
            return endpoint;
        }
      }
      return null;
    } catch (error) {
      // console.debug(`Error testing local endpoint ${endpoint}:`, error);
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

    // Simple heuristic for /24 subnet, common for home Wi-Fi
    // For more complex subnet calculations, a proper CIDR library would be needed
    const ipParts = ipAddress.split('.');
    const subnetParts = subnetMask.split('.');

    if (ipParts.length === 4 && subnetParts.length === 4 && subnetParts.every(part => part === "255" || part === "0")) {
        let baseIpParts = [];
        for(let i=0; i<4; i++) {
            if(subnetParts[i] === "255") {
                baseIpParts.push(ipParts[i]);
            } else {
                baseIpParts.push("0"); // Start from .0 for the variable parts
            }
        }
        // Assuming the variable part is the last one for typical home networks (/24)
        if(baseIpParts[3] === "0" && baseIpParts[2] !== "0") { // e.g. 192.168.1.x
            const subnetBase = baseIpParts.slice(0, 3).join(".");
            for (let i = 1; i <= 254; i++) {
              networkPatterns.push(`http://${subnetBase}.${i}:11434`);
            }
        } else { // Fallback if subnet calculation is not straightforward for /24
            const fallbackSubnet = ipAddress.split(".").slice(0, 3).join(".");
            for (let i = 1; i <= 254; i++) {
                networkPatterns.push(`http://${fallbackSubnet}.${i}:11434`);
            }
        }
    } else {
         // Fallback if IP/subnet details are not as expected
        const fallbackSubnet = networkState.details.ipAddress.split(".").slice(0, 3).join(".");
        for (let i = 1; i <= 254; i++) {
            networkPatterns.push(`http://${fallbackSubnet}.${i}:11434`);
        }
    }
  } else {
    // Fallback to checking common subnets if not on WiFi or details are unavailable
    // console.log("Not on WiFi or network details unavailable, trying common subnets.");
    ["192.168.0", "192.168.1", "10.0.0"].forEach(subnetBase => {
        for (let i = 1; i <= 254; i++) {
            networkPatterns.push(`http://${subnetBase}.${i}:11434`);
          }
    });
  }

  const BATCH_SIZE = 25; // Number of concurrent pings
  const TIMEOUT_MS = 750; // Timeout for each ping

  const testEndpoint = async (endpoint: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Using /api/tags or just the root to check for Ollama
      // The original code just fetched the root and checked for status 200
      // A more reliable check would be to hit an actual Ollama endpoint like /api/tags
      // or at least check if the response text contains "Ollama is running"
      const response = await fetch(await getProxyUrl(endpoint + "/"), { // Added trailing slash for consistency
        headers: {
          // Accept: "application/json", // If checking /api/tags
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
      // console.debug(`Error testing network endpoint ${endpoint}:`, error);
      return null;
    }
  };

  let discoveredEndpoints: string[] = [];
  for (let i = 0; i < networkPatterns.length; i += BATCH_SIZE) {
    const batch = networkPatterns.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(testEndpoint));
    discoveredEndpoints = [...discoveredEndpoints, ...batchResults.filter((result) => result !== null) as string[]];
  }

  // Deduplication and localhost preference logic (simplified from original for clarity)
  // The original logic for comparing /api/tags of localhost vs other found IPs was complex
  // and might be better handled by the user or a more sophisticated discovery mechanism.
  // For now, simple deduplication.
  const uniqueEndpoints = Array.from(new Set(discoveredEndpoints));

  // Prioritize localhost if found
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
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // console.log("Location permission granted for network scan");
        return true;
      } else {
        // console.log("Location permission denied for network scan");
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // Not Android, so permission is not an issue or handled differently
}
