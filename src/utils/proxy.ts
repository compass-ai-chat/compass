import {Platform as PlatformCust} from '@/src/utils/platform';
export let proxyUrl: string = "";

export function setProxyUrl(newUrl: string) {
  proxyUrl = newUrl;
}

export async function getProxyUrl(url: string): Promise<string> {

  if(url.includes("polaris.compass-ai.chat")) {
    return url;
  }

  // Only apply proxy for web or Tauri platforms
  if (!PlatformCust.isWeb) {
    return url;
  }

  // If no proxy URL is set, return original URL
  if (!proxyUrl || typeof proxyUrl !== 'string' || proxyUrl?.length == 0) {
    return url;
  }

  // Ensure proxy URL ends with slash
  const baseProxyUrl = proxyUrl.endsWith('/') ? proxyUrl : `${proxyUrl}/`;
  
  return `${baseProxyUrl}${url}`;
} 