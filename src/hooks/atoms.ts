import { atom } from "jotai";
import { unwrap } from "jotai/utils";
import { atomWithAsyncStorage } from "./storage";
import {
  Model,
  Thread,
  ChatMessage,
  Character,
  Provider,
  Voice,
  Document,
  Note
} from "@/src/types/core";
import { Tool } from "@/src/types/tools";
import { DropdownElement } from "@/src/components/ui/Dropdown";
import { User } from "@/src/types/user";
import { ToolBlueprint } from "../tools/tool.interface";

// ========================================
// CORE CONFIGURATION ATOMS
// ========================================

export const syncToPolarisAtom = atomWithAsyncStorage<boolean>("syncToPolaris", false);
export const localeAtom = atomWithAsyncStorage<string>("locale", "");
export const isDarkModeAtom = atomWithAsyncStorage<boolean>("isDarkMode", false);
export const hasSeenOnboardingAtom = atomWithAsyncStorage<boolean>("hasSeenOnboarding", false);

// ========================================
// SIMPLIFIED THREAD MANAGEMENT
// ========================================

// Base async storage atoms
const threadsStorageAtom = atomWithAsyncStorage<Thread[]>("threads", []);
const activeThreadIdStorageAtom = atomWithAsyncStorage<string>("activeThreadId", "");

// Unwrapped atoms - these return the value synchronously (with fallback during hydration)
export const threadsAtom = unwrap(threadsStorageAtom, (prev) => prev ?? []);
export const activeThreadIdAtom = unwrap(activeThreadIdStorageAtom, (prev) => prev ?? "");

// Helper function for creating default threads
export function createDefaultThread(name: string = "New thread"): Thread {
  return {
    id: Date.now().toString(),
    title: name,
    messages: [],
    selectedModel: undefined,
    character: undefined,
  };
}

// Cache for the default thread to prevent creating new objects on every read
let cachedDefaultThread: Thread | null = null;
function getOrCreateDefaultThread(): Thread {
  if (!cachedDefaultThread) {
    cachedDefaultThread = createDefaultThread();
  }
  return cachedDefaultThread;
}

// Reset the cached default thread (call when a real thread is created)
export function resetCachedDefaultThread() {
  cachedDefaultThread = null;
}

// Simplified current thread - derived synchronously from threads array
// This avoids the async read that was triggering Suspense on every update
export const currentThreadAtom = atom(
  (get) => {
    const threads = get(threadsAtom);
    const activeId = get(activeThreadIdAtom);
    
    // Find the active thread
    const found = threads.find((t: Thread) => t.id === activeId);
    if (found) {
      return found;
    }
    
    // If no active thread, return the last thread or a default
    if (threads.length > 0) {
      return threads[threads.length - 1];
    }
    
    // Return a stable default thread (not persisted until user sends a message)
    return getOrCreateDefaultThread();
  },
  (get, set, newThread: Thread) => {
    const threads = get(threadsAtom);
    const existingIndex = threads.findIndex((t: Thread) => t.id === newThread.id);
    
    if (existingIndex >= 0) {
      const updatedThreads = [...threads];
      updatedThreads[existingIndex] = newThread;
      set(threadsStorageAtom, updatedThreads);
    } else {
      // Reset cached default since we're adding a real thread
      resetCachedDefaultThread();
      set(threadsStorageAtom, [...threads, newThread]);
    }
    set(activeThreadIdStorageAtom, newThread.id);
  }
);

export type ThreadAction =
  | { type: "add"; payload: Thread }
  | { type: "update"; payload: Thread }
  | { type: "delete"; payload: string }
  | { type: "setCurrent"; payload: Thread }
  | { type: "clearAll" }
  | { type: "updateMessages"; payload: { threadId: string; messages: ChatMessage[] } }
  | { type: "updateMessage"; payload: { threadId: string; message: ChatMessage; index: number } };

export const threadActionsAtom = atom(
  null,
  (get, set, action: ThreadAction) => {
    const threads = get(threadsAtom);
    const activeId = get(activeThreadIdAtom);

    switch (action.type) {
      case "add":
        // Reset cached default since we're adding a real thread
        resetCachedDefaultThread();
        set(threadsStorageAtom, [...threads, action.payload]);
        set(activeThreadIdStorageAtom, action.payload.id);
        break;

      case "update":
        const updatedThreads = threads.map((t: Thread) => 
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        );
        set(threadsStorageAtom, updatedThreads);
        break;

      case "delete":
        const filteredThreads = threads.filter((t: Thread) => t.id !== action.payload);
        set(threadsStorageAtom, filteredThreads);
        if (activeId === action.payload) {
          if (filteredThreads.length > 0) {
            set(activeThreadIdStorageAtom, filteredThreads[filteredThreads.length - 1].id);
          } else {
            set(activeThreadIdStorageAtom, "");
          }
        }
        break;

      case "setCurrent":
        set(activeThreadIdStorageAtom, action.payload.id);
        if (!threads.find((t: Thread) => t.id === action.payload.id)) {
          resetCachedDefaultThread();
          set(threadsStorageAtom, [...threads, action.payload]);
        }
        break;

      case "clearAll":
        resetCachedDefaultThread();
        set(threadsStorageAtom, []);
        set(activeThreadIdStorageAtom, "");
        break;

      case "updateMessages":
        const threadsWithUpdatedMessages = threads.map((t: Thread) =>
          t.id === action.payload.threadId
            ? { ...t, messages: action.payload.messages }
            : t
        );
        set(threadsStorageAtom, threadsWithUpdatedMessages);
        break;

      case "updateMessage":
        const existinThread = threads.find((t: Thread) => t.id === action.payload.threadId);
        const existingMessage = existinThread?.messages[action.payload.index];
        const updatedMessage = { ...existingMessage, ...action.payload.message };
        const threadsWithUpdatedMessage = threads.map((t: Thread) =>
          t.id === action.payload.threadId
            ? { ...t, messages: [...t.messages.slice(0, action.payload.index), updatedMessage, ...t.messages.slice(action.payload.index + 1)] }
            : t,
        );
        set(threadsStorageAtom, threadsWithUpdatedMessage);
        break;
    }
  }
);

// ========================================
// UNIFIED RESOURCE MANAGEMENT
// ========================================

function createResourceAtom<T extends { id: string }>(localKey: string, defaultValue: T[] = []) {
  const localAtom = atomWithAsyncStorage<T[]>(localKey, defaultValue);
  const serverAtom = atom<T[]>([]);

  return atom(
    async (get) => {
      const syncToPolaris = await get(syncToPolarisAtom);
      return syncToPolaris ? get(serverAtom) : await get(localAtom);
    },
    async (get, set, newValue: T[]) => {
      const syncToPolaris = await get(syncToPolarisAtom);
      if (syncToPolaris) {
        set(serverAtom, newValue);
      } else {
        set(localAtom, newValue);
      }
    }
  );
}

export const charactersAtom = createResourceAtom<Character>("userCharacters");
export const providersAtom = createResourceAtom<Provider>("userProviders");
export const documentsAtom = createResourceAtom<Document>("documents");
export const toolsAtom = createResourceAtom<Tool>("userTools");

// ========================================
// CHAT STATE
// ========================================

export const isGeneratingAtom = atom<boolean>(false);
export const editingMessageIndexAtom = atom<number>(-1);
export const streamingMessageAtom = atom<{
  threadId: string;
  index: number;
  content: string;
  reasoning?: string;
  toolCalls?: any[];
} | null>(null);

// ========================================
// OTHER ATOMS
// ========================================

export const availableModelsAtom = atom<Model[]>([]);
export const sidebarVisibleAtom = atomWithAsyncStorage<boolean>("sidebarVisible", true);
export const searchEnabledAtom = atomWithAsyncStorage<boolean>("searchEnabled", false);

export const fontPreferencesAtom = atomWithAsyncStorage<{
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  messageGap: number;
}>("fontPreferences", {
  fontFamily: "System",
  fontSize: 18,
  lineHeight: 24,
  letterSpacing: 0.8,
  messageGap: 2,
});

export const previewCodeAtom = atom<{
  html?: string;
  css?: string;
  javascript?: string;
} | null>(null);

export const modalStateAtom = atom<{
  isVisible: boolean;
  type: "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue?: string;
}>({
  isVisible: false,
  type: "confirm",
  title: "",
  message: "",
});

export const defaultModelAtom = atomWithAsyncStorage<Model | undefined>("defaultModel", undefined);
export const defaultVoiceAtom = atomWithAsyncStorage<Voice | null>("defaultVoice", null);
export const ttsEnabledAtom = atomWithAsyncStorage<boolean>("ttsEnabled", false);

export const selectedChatDropdownOptionAtom = atomWithAsyncStorage<DropdownElement>(
  "selectedChatDropdownOption",
  { id: "", title: "", image: "", icon: undefined }
);

export const defaultChatDropdownOptionAtom = atomWithAsyncStorage<DropdownElement>(
  "defaultChatDropdownOption", 
  { id: "", title: "", image: "", icon: undefined }
);

export const hotToolsAtom = atomWithAsyncStorage<string[]>("hotTools", []);
export const thinkingActiveAtom = atomWithAsyncStorage<boolean>("thinkingActive", false);
export const toolBlueprintsAtom = atom<ToolBlueprint[]>([]);

export interface GeneratedImage {
  id: string;
  prompt: string;
  imagePath: string;
  createdAt: string;
}

export const generatedImagesAtom = atomWithAsyncStorage<GeneratedImage[]>("generatedImages", []);
export const selectedImageModelAtom = atomWithAsyncStorage<Model | undefined>("selectedImageModel", undefined);

export const polarisAuthTokenAtom = atom<string | undefined>(undefined);
export const polarisUserAtom = atomWithAsyncStorage<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
} | undefined>("polarisUser", undefined);

export const isServerConnectedAtom = atom<boolean>(false);
export const serverConnectionAtom = atom<{
  url: string;
  token: string;
  userId: string;
} | null>(null);

export interface LogEntry {
  component: string;
  function: string;
  date: string;
  message: string;
  level: "error" | "info" | "warn" | "debug";
}

export const logsAtom = atomWithAsyncStorage<LogEntry[]>("logs", []);
export const downloadingModelsAtom = atomWithAsyncStorage<{
  modelId: string;
  startTime: number;
}[]>("downloadingModels", []);

const getDefaultProxyUrl = () => {
  if (typeof window !== "undefined" && window?.location?.hostname === "nordwestt.com") {
    return "";
  }
  return "";
};

export const proxyUrlAtom = atomWithAsyncStorage<string>("proxyUrl", getDefaultProxyUrl());

// ========================================
// BACKWARD COMPATIBILITY EXPORTS
// ========================================

// Thread management compatibility
export const currentThreadLoadableAtom = currentThreadAtom;
export const currentThreadIdAtom = activeThreadIdAtom;
export const defaultThreadAtom = atom(() => createDefaultThread());

// Resource compatibility
export const userCharactersAtom = charactersAtom;
export const userProvidersAtom = providersAtom;
export const userDocumentsAtom = documentsAtom;
export const userToolsAtom = toolsAtom;
export const availableProvidersAtom = providersAtom;
export const availableVoicesAtom = atom<Voice[]>([]);

// Derived atoms - now synchronous since currentThreadAtom is synchronous
export const currentModelAtom = atom((get) => get(currentThreadAtom).selectedModel);
export const currentCharacterAtom = atom((get) => get(currentThreadAtom).character);
export const currentThreadMessagesAtom = atom((get) => get(currentThreadAtom).messages);

// Polaris compatibility atoms
export const polarisCharactersAtom = atom<Character[]>([]);
export const polarisProvidersAtom = atom<Provider[]>([]);
export const polarisDocumentsAtom = atom<Document[]>([]);
export const polarisToolsAtom = atom<Tool[]>([]);
export const polarisModelsAtom = atom<Model[]>([]);
export const polarisUsersAtom = atom<User[]>([]);

// Legacy atoms
export const currentIndexAtom = atom(0);
export const isAdminModeAtom = atom<boolean>(false);

// Legacy save functionality
export const saveCustomPrompts = atom(
  null,
  (get, set, characters: Character[]) => {
    set(charactersAtom, characters);
    const threads = get(threadsAtom);
    const updatedThreads = threads.map((thread: Thread) => {
      const updatedCharacter = characters.find((c) => c.id === thread.character?.id);
      return updatedCharacter ? { ...thread, character: updatedCharacter } : thread;
    });
    set(threadsStorageAtom, updatedThreads);
  }
);
