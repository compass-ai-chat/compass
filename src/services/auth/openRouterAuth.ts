import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ssoConfig } from '@/src/config/sso';

const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth';
const STORAGE_KEY = 'openrouter_auth';

export interface OpenRouterUser {
  id?: string;
  email?: string;
  name?: string;
}

export interface OpenRouterAuthState {
  apiKey: string;
  user?: OpenRouterUser;
  expiresAt?: number;
}

type AuthStateListener = (state: OpenRouterAuthState | null) => void;

class OpenRouterAuthService {
  private authState: OpenRouterAuthState | null = null;
  private listeners: Set<AuthStateListener> = new Set();
  private initialized = false;

  async initialize(): Promise<OpenRouterAuthState | null> {
    if (this.initialized) return this.authState;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.authState = JSON.parse(stored);
        this.notifyListeners();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load OpenRouter auth state:', error);
    }
    return this.authState;
  }

  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.authState));
  }

  async initiateLogin(): Promise<void> {
    const callbackUrl = Platform.OS === 'web'
      ? `${window.location.origin}/auth/callback`
      : 'compass://auth/callback';

    // OpenRouter uses a simple OAuth flow - redirect to their auth page
    const authUrl = new URL(OPENROUTER_AUTH_URL);
    authUrl.searchParams.set('callback_url', callbackUrl);

    if (Platform.OS === 'web') {
      // Store current URL to return after auth
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('auth_return_url', window.location.href);
      }
      window.location.href = authUrl.toString();
    } else {
      // For mobile, use WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        callbackUrl
      );

      if (result.type === 'success' && result.url) {
        await this.handleCallback(result.url);
      }
    }
  }

  async handleCallback(callbackUrl: string): Promise<OpenRouterAuthState> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code received from OpenRouter');
    }

    // OpenRouter returns the API key directly as the code
    // The code IS the API key in OpenRouter's OAuth flow
    this.authState = {
      apiKey: code,
      user: undefined, // OpenRouter doesn't return user info in the callback
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.authState));
    this.notifyListeners();

    return this.authState;
  }

  async setAuthState(state: OpenRouterAuthState): Promise<void> {
    this.authState = state;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.authState));
    this.notifyListeners();
  }

  async logout(): Promise<void> {
    this.authState = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  getApiKey(): string | null {
    return this.authState?.apiKey || null;
  }

  getUser(): OpenRouterUser | null {
    return this.authState?.user || null;
  }

  isAuthenticated(): boolean {
    return this.authState?.apiKey !== null && this.authState?.apiKey !== undefined;
  }

  getAuthState(): OpenRouterAuthState | null {
    return this.authState;
  }
}

export const openRouterAuth = new OpenRouterAuthService();
