import { atom } from "jotai";
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

export const threadsAtom = atomWithAsyncStorage<Thread[]>("threads", []);
export const activeThreadIdAtom = atomWithAsyncStorage<string>("activeThreadId", "");

// Helper function
function createDefaultThread(name: string = "New thread"): Thread {
  return {
    id: Date.now().toString(),
    title: name,
    messages: [],
    selectedModel: undefined,
    character: undefined,
  };
}

// Simplified current thread - derived from threads array
export const currentThreadAtom = atom(
  async (get) => {
    const threads = await get(threadsAtom);
    const activeId = await get(activeThreadIdAtom);
    const found = threads.find((t: Thread) => t.id === activeId);
    
    // If no thread found, return a default thread
    if (!found) {
      return createDefaultThread();
    }
    
    return found;
  },
  async (get, set, newThread: Thread) => {
    const threads = await get(threadsAtom);
    const existingIndex = threads.findIndex((t: Thread) => t.id === newThread.id);
    
    if (existingIndex >= 0) {
      // Update existing thread
      const updatedThreads = [...threads];
      updatedThreads[existingIndex] = newThread;
      set(threadsAtom, updatedThreads);
    } else {
      // Add new thread
      set(threadsAtom, [...threads, newThread]);
    }
    
    // Set as active
    set(activeThreadIdAtom, newThread.id);
  }
);

export type ThreadAction =
  | { type: "add"; payload: Thread }
  | { type: "update"; payload: Thread }
  | { type: "delete"; payload: string }
  | { type: "setCurrent"; payload: Thread }
  | { type: "clearAll" }
  | { type: "updateMessages"; payload: { threadId: string; messages: ChatMessage[] } }
  | { type: "updateMessage"; payload: { threadId: string; message: ChatMessage, index: number } };

// Simplified thread actions
export const threadActionsAtom = atom(
  null,
  async (get, set, action: ThreadAction) => {
    const threads = await get(threadsAtom);
    const activeId = await get(activeThreadIdAtom);

    switch (action.type) {
      case "add":
        set(threadsAtom, [...threads, action.payload]);
        set(activeThreadIdAtom, action.payload.id);
        break;

      case "update":
        const updatedThreads = threads.map((t: Thread) => 
          t.id === action.payload.id ? action.payload : t
        );
        set(threadsAtom, updatedThreads);
        break;

      case "delete":
        const filteredThreads = threads.filter((t: Thread) => t.id !== action.payload);
        set(threadsAtom, filteredThreads);
        
        // If we deleted the active thread, switch to another
        if (activeId === action.payload) {
          if (filteredThreads.length > 0) {
            set(activeThreadIdAtom, filteredThreads[filteredThreads.length - 1].id);
          } else {
            set(activeThreadIdAtom, "");
          }
        }
        break;

      case "setCurrent":
        set(activeThreadIdAtom, action.payload.id);
        // Ensure thread exists
        if (!threads.find((t: Thread) => t.id === action.payload.id)) {
          set(threadsAtom, [...threads, action.payload]);
        }
        break;

      case "clearAll":
        set(threadsAtom, []);
        set(activeThreadIdAtom, "");
        break;

      case "updateMessage":
        const existingMessage = threads.find(t => t.id === action.payload.threadId)?.messages[action.payload.index];
        const updatedMessage = {
          ...existingMessage,
          ...action.payload.message
        }
        const threadsWithUpdatedMessage = threads.map((t) =>
          t.id === action.payload.threadId
            ? { ...t, messages: [...t.messages.slice(0, action.payload.index), updatedMessage, ...t.messages.slice(action.payload.index + 1)] }
            : t,
        );
        await set(threadsAtom, threadsWithUpdatedMessage);
        break;

      case "updateMessages":
        const threadsWithUpdatedMessages = threads.map((t: Thread) =>
          t.id === action.payload.threadId
            ? { ...t, messages: action.payload.messages }
            : t
        );
        set(threadsAtom, threadsWithUpdatedMessages);
        break;
    }
  }
);

// ========================================
// UNIFIED RESOURCE MANAGEMENT
// ========================================

// Generic resource atom creator - eliminates duplication
function createResourceAtom<T extends { id: string }>(
  localKey: string,
  defaultValue: T[] = []
) {
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
        // TODO: Sync to server via service
      } else {
        set(localAtom, newValue);
      }
    }
  );
}

// Simplified resource atoms using the generic creator
export const providersAtom = createResourceAtom<Provider>("userProviders");
export const charactersAtom = createResourceAtom<Character>("userCharacters");
export const documentsAtom = createResourceAtom<Document>("documents");
export const toolsAtom = createResourceAtom<Tool>("userTools");

// Models are slightly different - they come from providers
export const modelsAtom = atom<Model[]>([]);

// ========================================
// CHAT STATE
// ========================================

export const isGeneratingAtom = atom<boolean>(false);
export const editingMessageIndexAtom = atom<number>(-1);

// Streaming state - not persisted
export const streamingMessageAtom = atom<{
  threadId: string;
  index: number;
  content: string;
  reasoning?: string;
  toolCalls?: any[];
} | null>(null);

// ========================================
// UI STATE
// ========================================

export const sidebarVisibleAtom = atomWithAsyncStorage<boolean>("sidebarVisible", true);
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

// ========================================
// PREFERENCES
// ========================================

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

export const defaultModelAtom = atomWithAsyncStorage<Model | undefined>("defaultModel", undefined);
export const defaultVoiceAtom = atomWithAsyncStorage<Voice | null>("defaultVoice", null);
export const ttsEnabledAtom = atomWithAsyncStorage<boolean>("ttsEnabled", false);
export const searchEnabledAtom = atomWithAsyncStorage<boolean>("searchEnabled", false);

// ========================================
// DROPDOWN/SELECTION STATE
// ========================================

export const selectedChatDropdownOptionAtom = atomWithAsyncStorage<DropdownElement>(
  "selectedChatDropdownOption",
  { id: "", title: "", image: "", icon: undefined }
);

export const defaultChatDropdownOptionAtom = atomWithAsyncStorage<DropdownElement>(
  "defaultChatDropdownOption", 
  { id: "", title: "", image: "", icon: undefined }
);

// ========================================
// FEATURE FLAGS / TOOLS
// ========================================

export const hotToolsAtom = atomWithAsyncStorage<string[]>("hotTools", []);
export const thinkingActiveAtom = atomWithAsyncStorage<boolean>("thinkingActive", false);
export const toolBlueprintsAtom = atom<ToolBlueprint[]>([]);

// ========================================
// GENERATED CONTENT
// ========================================

export interface GeneratedImage {
  id: string;
  prompt: string;
  imagePath: string;
  createdAt: string;
}

export const generatedImagesAtom = atomWithAsyncStorage<GeneratedImage[]>("generatedImages", []);
export const selectedImageModelAtom = atomWithAsyncStorage<Model | undefined>("selectedImageModel", undefined);

// ========================================
// POLARIS/SERVER STATE  
// ========================================

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

// ========================================
// TECHNICAL/DEBUGGING
// ========================================

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

// ========================================
// NETWORK/PROXY
// ========================================

const getDefaultProxyUrl = () => {
  if (typeof window !== "undefined" && window?.location?.hostname === "nordwestt.com") {
    return "";
  }
  return "";
};

export const proxyUrlAtom = atomWithAsyncStorage<string>("proxyUrl", getDefaultProxyUrl());

// ========================================
// LEGACY COMPATIBILITY EXPORTS
// ========================================

// For smooth migration - these point to the new simplified versions
export const currentThreadLoadableAtom = currentThreadAtom; // Remove loadable pattern
export const currentThreadIdAtom = activeThreadIdAtom; // Rename for clarity

// Legacy default thread atom
export const defaultThreadAtom = atom(async () => createDefaultThread());

// Resource atom aliases for backward compatibility
export const userCharactersAtom = charactersAtom;
export const userProvidersAtom = providersAtom;
export const userDocumentsAtom = documentsAtom;
export const userToolsAtom = toolsAtom;

// Legacy compatibility
export const availableProvidersAtom = providersAtom;
export const availableModelsAtom = modelsAtom;
export const availableVoicesAtom = atom<Voice[]>([]);

export const currentModelAtom = atom(async (get) => (await get(currentThreadAtom)).selectedModel);
export const currentCharacterAtom = atom(async (get) => (await get(currentThreadAtom)).character);
export const currentThreadMessagesAtom = atom(async (get) => (await get(currentThreadAtom)).messages);

// Polaris atoms - now handled internally by the generic resource atoms
export const polarisCharactersAtom = atom<Character[]>([]);
export const polarisProvidersAtom = atom<Provider[]>([]);
export const polarisDocumentsAtom = atom<Document[]>([]);
export const polarisToolsAtom = atom<Tool[]>([]);
export const polarisModelsAtom = atom<Model[]>([]);
export const polarisUsersAtom = atom<User[]>([]);

// Legacy chat actions - simplified
export const chatActionsAtom = atom(
  null,
  async (get, set, action: { type: "send" | "interrupt"; payload?: any }) => {
    const currentThread = await get(currentThreadAtom);

    switch (action.type) {
      case "send":
        const newMessage = action.payload;
        const updatedThread = {
          ...currentThread,
          messages: [...currentThread.messages, newMessage],
        };
        set(currentThreadAtom, updatedThread);
        break;
      case "interrupt":
        // Handle interrupt logic
        break;
    }
  }
);

// Legacy save prompts functionality
export const saveCustomPrompts = atom(
  null,
  async (get, set, characters: Character[]) => {
    await set(charactersAtom, characters);
    
    // Update any threads that use these characters
    const threads = await get(threadsAtom);
    const updatedThreads = threads.map((thread) => {
      const updatedCharacter = characters.find((c) => c.id === thread.character?.id);
      return updatedCharacter ? { ...thread, character: updatedCharacter } : thread;
    });
    
    set(threadsAtom, updatedThreads);
  }
);

// Legacy index atom
export const currentIndexAtom = atom(0);

// Legacy admin atoms
export const isAdminModeAtom = atom<boolean>(false);

// ========================================
// LEGACY COMPATIBILITY EXPORTS
// ========================================

// For smooth migration - these point to the new simplified versions
export const currentThreadLoadableAtom = currentThreadAtom; // Remove loadable pattern
export const currentThreadIdAtom = activeThreadIdAtom; // Rename for clarity

// Legacy default thread atom
export const defaultThreadAtom = atom(async () => createDefaultThread());

// Resource atom aliases for backward compatibility
export const userCharactersAtom = charactersAtom;
export const userProvidersAtom = providersAtom;
export const userDocumentsAtom = documentsAtom;
export const userToolsAtom = toolsAtom;

// Polaris atoms - now handled internally by the generic resource atoms
export const polarisCharactersAtom = atom<Character[]>([]);
export const polarisProvidersAtom = atom<Provider[]>([]);
export const polarisDocumentsAtom = atom<Document[]>([]);
export const polarisToolsAtom = atom<Tool[]>([]);
export const polarisModelsAtom = atom<Model[]>([]);
export const polarisUsersAtom = atom<User[]>([]);
export const polarisServerAtom = atom<{
  endpoint: string;
  apiKey: string;
} | null>(null);

// Legacy chat actions - simplified
export const chatActionsAtom = atom(
  null,
  async (get, set, action: { type: "send" | "interrupt"; payload?: any }) => {
    const currentThread = await get(currentThreadAtom);

    switch (action.type) {
      case "send":
        const newMessage = action.payload;
        const updatedThread = {
          ...currentThread,
          messages: [...currentThread.messages, newMessage],
        };
        set(currentThreadAtom, updatedThread);
        break;
      case "interrupt":
        // Handle interrupt logic
        break;
    }
  }
);

// Legacy save prompts functionality
export const saveCustomPrompts = atom(
  null,
  async (get, set, characters: Character[]) => {
    await set(charactersAtom, characters);
    
    // Update any threads that use these characters
    const threads = await get(threadsAtom);
    const updatedThreads = threads.map((thread) => {
      const updatedCharacter = characters.find((c) => c.id === thread.character?.id);
      return updatedCharacter ? { ...thread, character: updatedCharacter } : thread;
    });
    
    set(threadsAtom, updatedThreads);
  }
);

// Legacy index atom
export const currentIndexAtom = atom(0);

// Legacy admin atoms
export const isAdminModeAtom = atom<boolean>(false);
