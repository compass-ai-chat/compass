export interface ThreadMetadata {
  documentIds?: string[];
  webContent?: string[];
  urls?: string[];
  [key: string]: any; // Allow for future extensibility
}

export interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
  selectedModel?: Model;
  character?: Character;
  metadata?: ThreadMetadata;
}

export interface ChatMessage {
  content: string;
  isUser: boolean;
  isSystem?: boolean;
  character?: Character;
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
  provider: Provider;
  pricePerMillionInputTokens: number;
  pricePerMillionOutputTokens: number;
}

export interface AllowedModel {
  id: string;
  providerId: string;
  priority: number;
}

export interface Character {
  id: string;
  name: string;
  content: string;
  image?: string;
  icon?: string;
  documentIds?: string[];
  voice?: Voice;
  allowedModels?: AllowedModel[];
  exposeAsModel?: boolean;
  toolIds?: string[];
}

export interface Voice {
  id: string;
  name: string;
  previewUrl: string;
  description: string;
  provider: Provider;
}

export interface Provider {
  id: string;
  name?: string;
  capabilities?: {
    llm: boolean;
    tts: boolean;
    stt: boolean;
    search: boolean;
    image?: boolean;
    embedding?: boolean;
  };
  apiKey?: string;
  endpoint: string;
  logo: any;
  keyRequired?: boolean;
  signupUrl?: string;
  syncToPolaris?: boolean;
}

export interface Document {
  id: string;
  name: string;
  path: string;
  pages: number;
  type: "pdf";
  chunks?: string[];
  embeddings?: number[][];
}

export interface DocumentPreview {
  id: string;
  name: string;
  path: string;
  pages: number;
  type: "pdf";
}

export interface ResourceMetadata {
  id?: string;
  ownerId?: string; // null for local-only resources
  isServerResource?: boolean; // true if it exists on the server
  isSynced?: boolean; // true if local changes are synced to server
  lastSyncedAt?: number; // timestamp of last sync
  serverResourceId?: string; // ID on the server (may differ from local ID)
}

export interface Provider extends ResourceMetadata {
  // existing Provider properties
}

export interface Character extends ResourceMetadata {
  // existing Character properties
}

export interface Model extends ResourceMetadata {
  // existing Model properties
}

export interface Note extends ResourceMetadata {
  title: string;
  content: string;
}
