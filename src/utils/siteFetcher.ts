import { Readability } from "@mozilla/readability";
import { getProxyUrl } from "./proxy";
import { Platform } from "react-native";

export async function fetchSiteText(url: string): Promise<string> {
  const proxy = "https://workers-playground-delicate-bread-86d5.thomas-180.workers.dev"
  const badProxy = "https://proxy.cors.sh"
  const searchUrl =
    Platform.OS === "web" ? `${proxy}/${url}` : `${url}`;

  const html = await fetch(searchUrl).then((res) => res.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article?.textContent) {
    return "";
  }
  // Trim and clean up the content
  const cleanContent = article.textContent
    .trim()
    // .replace(/\s+/g, " ")
    .slice(0, 4000); // Limit content length

  return cleanContent;
}
