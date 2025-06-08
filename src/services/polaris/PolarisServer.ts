import { Character, Provider, Model, DocumentPreview } from "@/src/types/core";
import { toastService } from "@/src/services/toastService";
import LogService from "@/utils/LogService";
import { getProxyUrl } from "@/src/utils/proxy";
import { Document } from "@/src/types/core";
import { Platform } from "react-native";
import { CreateUserDto, UpdateUserDto, User } from "@/src/types/user";
import { Tool, CreateToolDto, UpdateToolDto } from "@/src/types/tools";
import { CreateBlueprintDto, UpdateBlueprintDto } from "@/src/types/tools";
import { ToolBlueprint } from "@/src/tools/tool.interface";
/**
 * PolarisServer handles communication with the Compass server
 * for syncing characters, providers, and models.
 */
export class PolarisServer {
  private serverUrl: string;
  private apiKey: string;
  private isConnected: boolean = false;

  constructor(serverUrl: string = "", apiKey: string = "") {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
  }

  /**
   * Initialize connection to the server
   */
  async connect(serverUrl: string, apiKey: string): Promise<boolean> {
    try {
      this.serverUrl = serverUrl;
      this.apiKey = apiKey;

      try {
        const response = await this.makeRequest("/api/admin/documents", "GET");
        this.isConnected = true;
      } catch (error) {
        this.isConnected = false;
      }

      return this.isConnected;
    } catch (error) {
      if (error instanceof Error) {
        this.isConnected = false;
        toastService.danger({
          title: "Connection Failed",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Connection Failed",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Check if connected to server
   */
  isServerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get server connection info
   */
  getConnectionInfo() {
    return {
      serverUrl: this.serverUrl,
      isConnected: this.isConnected,
    };
  }

  // ===== CHARACTER OPERATIONS =====

  /**
   * Get all characters from the server
   */
  async getCharacters(): Promise<Character[]> {
    try {
      const response = await this.makeRequest("/api/admin/characters", "GET");
      return response.characters.map((char: any) => ({
        ...char,
        isServerResource: true,
        isSynced: true,
        serverResourceId: char.id,
      }));
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getCharacters" },
          "error",
        );
      }
      return [];
    }
  }

  /**
   * Get a specific character from the server
   */
  async getCharacter(id: string): Promise<Character | null> {
    try {
      const response = await this.makeRequest(
        `/api/admin/characters/${id}`,
        "GET",
      );
      return {
        ...response.character,
        isServerResource: true,
        isSynced: true,
        serverResourceId: response.character.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Create a new character on the server
   */
  async createCharacter(character: Character): Promise<Character | null> {
    try {
      const payload = {
        name: character.name,
        content: character.content,
        icon: character.icon,
        image: character.image,
        documentIds: character.documentIds,
        allowedModels: character.allowedModels,
        exposeAsModel: character.exposeAsModel,
        toolIds: character.toolIds,
      };

      const response = await this.makeRequest(
        "/api/admin/characters",
        "POST",
        payload,
      );

      return {
        ...character,
        id: response.id,
        isServerResource: true,
        isSynced: true,
        serverResourceId: response.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Update an existing character on the server
   */
  async updateCharacter(character: Character): Promise<Character | null> {
    try {
      const serverId = character.serverResourceId || character.id;
      const payload = {
        name: character.name,
        content: character.content,
        icon: character.icon,
        image: character.image,
        documentIds: character.documentIds,
        allowedModels: character.allowedModels,
        exposeAsModel: character.exposeAsModel,
        toolIds: character.toolIds,
      };

      await this.makeRequest(
        `/api/admin/characters/${serverId}`,
        "PUT",
        payload,
      );

      return {
        ...character,
        isServerResource: true,
        isSynced: true,
        lastSyncedAt: Date.now(),
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Delete a character from the server
   */
  async deleteCharacter(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/characters/${id}`, "DELETE");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  // ===== PROVIDER OPERATIONS =====

  /**
   * Get all providers from the server
   */
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await this.makeRequest("/api/admin/providers", "GET");
      return response.providers.map((provider: any) => ({
        ...provider,
        isServerResource: true,
        isSynced: true,
        serverResourceId: provider.id,
      }));
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getProviders" },
          "error",
        );
      }
      return [];
    }
  }

  /**
   * Create a new provider on the server
   */
  async createProvider(provider: Provider): Promise<Provider | null> {
    try {
      // Don't send the API key in the payload if it's sensitive
      const payload = {
        name: provider.name,
        endpoint: provider.endpoint,
        capabilities: provider.capabilities,
        logo: provider.logo,
        apiKey: provider.apiKey, // Note: This will be stored securely on the server
      };

      const response = await this.makeRequest(
        "/api/admin/providers",
        "POST",
        payload,
      );

      return {
        ...provider,
        id: response.id,
        isServerResource: true,
        isSynced: true,
        serverResourceId: response.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Update an existing provider on the server
   */
  async updateProvider(provider: Provider): Promise<Provider | null> {
    try {
      const serverId = provider.serverResourceId || provider.id;
      const payload = {
        name: provider.name,
        endpoint: provider.endpoint,
        capabilities: provider.capabilities,
        logo: provider.logo,
        apiKey: provider.apiKey, // Include API key for updates
      };

      await this.makeRequest(
        `/api/admin/providers/${serverId}`,
        "PUT",
        payload,
      );

      return {
        ...provider,
        isServerResource: true,
        isSynced: true,
        lastSyncedAt: Date.now(),
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Delete a provider from the server
   */
  async deleteProvider(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/providers/${id}`, "DELETE");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  // ===== MODEL OPERATIONS =====

  /**
   * Get all models from the server
   */
  async getModels(): Promise<Model[]> {
    try {
      const response = await this.makeRequest("/api/admin/models", "GET");
      return response.models.map((model: any) => ({
        ...model,
        isServerResource: true,
        isSynced: true,
        serverResourceId: model.id,
      }));
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return [];
    }
  }

  // ===== DOCUMENT OPERATIONS =====

  /**
   * Get all documents from the server
   */
  async getDocuments(): Promise<DocumentPreview[]> {
    try {
      const response = await this.makeRequest("/api/admin/documents", "GET");
      return response.documents;
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getDocuments" },
          "error",
        );
      }
      return [];
    }
  }

  /**
   * Upload a document to the server
   */
  async uploadDocument(
    document: Document,
    fileData?: Blob,
  ): Promise<Document | null> {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add document metadata
      formData.append("name", document.name);
      formData.append("type", document.type);

      // Add file if provided
      if (fileData) {
        formData.append("file", fileData);
      } else if (document.path && Platform.OS === "web") {
        // For web, try to get the file from the path
        const response = await fetch(document.path);
        const blob = await response.blob();
        formData.append("file", blob, document.name);
      } else {
        throw new Error("File data is required for document upload");
      }

      // Custom request for file upload
      const url = await getProxyUrl(`${this.serverUrl}/api/admin/documents`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server returned ${response.status}`,
        );
      }

      const responseData = await response.json();

      return {
        ...document,
        id: responseData.id,
        path: responseData.path,
        pages: responseData.pages,
        chunks: responseData.chunks,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Get a specific document from the server
   */
  async getDocument(id: string): Promise<Document | null> {
    try {
      const response = await this.makeRequest(
        `/api/admin/documents/${id}`,
        "GET",
      );
      return {
        ...response.document,
        isServerResource: true,
        isSynced: true,
        serverResourceId: response.document.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Delete a document from the server
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/documents/${id}`, "DELETE");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  // ===== EMBEDDING MODEL OPERATIONS =====

  /**
   * Set the embedding model
   */
  async setEmbeddingModel(modelId: string): Promise<boolean> {
    try {
      if (!modelId) {
        throw new Error("Model ID is required");
      }

      await this.makeRequest(`/api/admin/settings/embedding`, "PATCH", {
        modelId: modelId,
      });

      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  async getEmbeddingModel(): Promise<string | null> {
    try {
      const response = await this.makeRequest(
        `/api/admin/settings/embedding`,
        "GET",
      );

      return response.modelId || null;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
    }
    return null;
  }

  async syncAllModels(): Promise<boolean | null> {
    try {
      const response = await this.makeRequest(`/api/admin/models/sync`, "POST");

      return response.success;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
    }
    return null;
  }

  async getStatistics(startDate?: Date, endDate?: Date) : Promise<StatisticEntity[]> {
    try {
      const params = this.formatDateParams(startDate, endDate);
      const response = await this.makeRequest(`/api/admin/statistics${params?`?${params}`:""}`, "GET");
      return response.statistics;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
    }
    return [];
  }

  async getCharacterStatistics(startDate?: Date, endDate?: Date) : Promise<StatisticEntity[]> {
    try {
      const params = this.formatDateParams(startDate, endDate);
      const response = await this.makeRequest(`/api/admin/statistics/character-usage${params?`?${params}`:""}`, "GET");
      return response.statistics;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
    }
    return [];
  }

  async getDailyStatistics(startDate?:Date, endDate?:Date) : Promise<DailyUsageStatsDto[]> {
    try {
      const params = this.formatDateParams(startDate, endDate);
      const response = await this.makeRequest(`/api/admin/statistics/daily-stats${params?`?${params}`:""}`, "GET");
      return response.dailyStats;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
    }
    return [];
  }

  async getDailyModelStatistics(startDate?:Date, endDate?:Date) : Promise<DailyModelStatsDto[]> {
    try {
      const params = this.formatDateParams(startDate, endDate);
      const response = await this.makeRequest(`/api/admin/statistics/daily-usage${params?`?${params}`:""}`, "GET");
      return response.dailyUsage;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
    }
    return [];
  }

  // ===== USER OPERATIONS =====

  /**
   * Get all users from the server
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.makeRequest("/api/admin/users", "GET");
      return response.users.map((user: any) => ({
        ...user,
        isServerResource: true,
      }));
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getUsers" },
          "error",
        );
      }
      return [];
    }
  }

  /**
   * Get a specific user from the server
   */
  async getUser(id: string): Promise<User | null> {
    try {
      const response = await this.makeRequest(
        `/api/admin/users/${id}`,
        "GET",
      );
      return {
        ...response.user,
        isServerResource: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Create a new user on the server
   */
  async createUser(user: CreateUserDto): Promise<User | null> {
    try {
      const response = await this.makeRequest(
        "/api/admin/users",
        "POST",
        user,
      );

      return {
        id: response.id,
        ...user,
        isServerResource: true,
        isActive: true,
        isAdmin: user.isAdmin || false,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Update an existing user on the server
   */
  async updateUser(id: string, user: UpdateUserDto): Promise<boolean> {
    try {
      await this.makeRequest(
        `/api/admin/users/${id}`,
        "PUT",
        user,
      );
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Delete a user from the server
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/users/${id}`, "DELETE");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Activate a user
   */
  async activateUser(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/users/${id}/activate`, "PUT");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/users/${id}/deactivate`, "PUT");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/users/${id}/promote`, "PUT");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Demote user from admin
   */
  async demoteFromAdmin(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/users/${id}/demote`, "PUT");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  // ===== TOOL OPERATIONS =====

  /**
   * Get all tools from the server
   */
  async getTools(): Promise<Tool[]> {
    try {
      const response = await this.makeRequest("/api/admin/tools", "GET");
      return response.tools.map((tool: any) => ({
        ...tool,
        isServerResource: true,
      }));
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getTools" },
          "error",
        );
      }
      return [];
    }
  }

  /**
   * Get a specific tool from the server
   */
  async getTool(id: string): Promise<Tool | null> {
    try {
      const response = await this.makeRequest(`/api/admin/tools/${id}`, "GET");
      return {
        ...response.tool,
        isServerResource: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Get all tool blueprints from the server
   */
  async getToolBlueprints(): Promise<ToolBlueprint[]> {
    try {
      const response = await this.makeRequest("/api/admin/tools/blueprints", "GET");
      return response.blueprints;
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getToolBlueprints" },
          "error",
        );
      }
      return [];
    }
  }

  /**
   * Get a specific tool blueprint from the server
   */
  async getToolBlueprint(name: string): Promise<ToolBlueprint | null> {
    try {
      const response = await this.makeRequest(`/api/admin/tools/blueprints/${name}`, "GET");
      return response.blueprint;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Create a new tool blueprint on the server
   */
  async createToolBlueprint(blueprint: CreateBlueprintDto): Promise<string | null> {
    try {
      const response = await this.makeRequest("/api/admin/tools/blueprints", "POST", blueprint);
      return response.name;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Update an existing tool blueprint on the server
   */
  async updateToolBlueprint(name: string, blueprint: UpdateBlueprintDto): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/tools/blueprints/${name}`, "PUT", blueprint);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Delete a tool blueprint from the server
   */
  async deleteToolBlueprint(name: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/tools/blueprints/${name}`, "DELETE");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Get all tool types from the server
   */
  async getToolTypes(): Promise<Record<string, { paramsSchema: any; configSchema: any }>> {
    try {
      const blueprints = await this.getToolBlueprints();
      return blueprints.reduce((acc, blueprint) => {
        acc[blueprint.name] = {
          paramsSchema: blueprint.paramsSchema,
          configSchema: blueprint.configSchema,
        };
        return acc;
      }, {} as Record<string, { paramsSchema: any; configSchema: any }>);
    } catch (error) {
      if (error instanceof Error) {
        LogService.log(
          error,
          { component: "PolarisServer", function: "getToolTypes" },
          "error",
        );
      }
      return {};
    }
  }

  /**
   * Create a new tool on the server
   */
  async createTool(tool: CreateToolDto): Promise<string | null> {
    try {
      const response = await this.makeRequest("/api/admin/tools", "POST", {
        ...tool,
        blueprintId: tool.type,
      });
      return response.id;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Update an existing tool on the server
   */
  async updateTool(id: string, tool: UpdateToolDto): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/tools/${id}`, "PUT", {
        ...tool,
        blueprintId: tool.type,
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  /**
   * Delete a tool from the server
   */
  async deleteTool(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/admin/tools/${id}`, "DELETE");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      return false;
    }
  }

  // ===== HELPER METHODS =====

  private formatDateParams(startDate?: Date, endDate?: Date): string {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    
    return params.toString();
  };

  /**
   * Make a request to the server
   */
  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
  ): Promise<any> {
    if (!this.serverUrl && method !== "GET") {
      throw new Error("Server URL not configured");
    }

    try {
      const url = await getProxyUrl(`${this.serverUrl}${endpoint}`);

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server returned ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        toastService.danger({
          title: "Error",
          description: error.message,
        });
      } else {
        toastService.danger({
          title: "Error",
          description: "Unknown error",
        });
      }
      throw error;
    }
  }
}

// Export a singleton instance
export default new PolarisServer();

export interface DailyModelStatsDto {
  date: string;           // Format: 'YYYY-MM-DD'
  characterName: string;
  modelId: string;
  requestCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface DailyUsageStatsDto {
  date: string;
  messageCount: number;
  activeUsers: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

interface StatisticsReponse {
  statistics: StatisticEntity[]
}

export interface StatisticEntity {
  id: string;

  userId: string;

  characterName: string;

  modelId: string;

  providerId: string;

  providerName: string;

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  duration: number; // in milliseconds

  timestamp: Date;
} 