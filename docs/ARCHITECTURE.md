# Compass Architecture Documentation

## Overview

Compass is a modern, open-source Large Language Model (LLM) client designed to provide a seamless AI chat experience across multiple platforms. Built with React Native and Expo, it offers a rich set of features while maintaining high performance and user experience. The goal is to promote private, decentralized AI whilst maintaining access to cloud-based AI through APIs.

## Technology Stack

### Core Framework
- **React Native 0.81.5** - Cross-platform mobile development framework
- **Expo ~54.0.31** - React Native toolchain and platform
- **React 19.1.0** - JavaScript library for building user interfaces
- **TypeScript ~5.9.2** - Type-safe JavaScript

### Navigation & Routing
- **Expo Router ~6.0.21** - File-based routing for React Native
- **React Navigation** - Navigation library for stack and tab navigation

### State Management
- **Jotai ^2.15.1** - Primitive and flexible state management
- **AsyncStorage** - Persistent local storage
- **Atoms Pattern** - Atomic state management with async storage integration

### Styling & UI
- **NativeWind ^5.0.0** - Tailwind CSS for React Native
- **Tailwind CSS ^4.1.17** - Utility-first CSS framework
- **React Native Reanimated** - Smooth animations and gestures

### AI & Chat
- **Vercel AI SDK (ai) ^6.0.48** - Unified interface for AI providers
- **@ai-sdk/anthropic ^3.0.23** - Anthropic Claude integration
- **@ai-sdk/openai ^3.0.18** - OpenAI GPT integration
- **@ai-sdk/groq ^3.0.15** - Groq integration
- **@ai-sdk/mistral ^3.0.12** - Mistral AI integration
- **@ai-sdk/xai ^3.0.33** - xAI integration
- **ollama-ai-provider-v2 ^3.0.2** - Ollama integration

### Cross-Platform Support
- **Tauri ^2.1.0** - Desktop application framework (Linux, Windows)
- **Docker** - Container deployment
- **Expo Build** - Mobile app building (iOS, Android)

### Document Processing
- **@mozilla/readability ^0.5.0** - Web content extraction
- **pdfjs-dist ^4.10.38** - PDF processing

### Additional Features
- **react-i18next ^15.5.1** - Internationalization
- **react-native-markdown-display ^7.0.2** - Markdown rendering
- **expo-image-picker** - Image selection and manipulation
- **react-native-chart-kit** - Data visualization

## Application Architecture

### Main Application Sections

The application is organized into five main sections accessible through tab navigation:

1. **Index (Chat)** - Primary chat interface
2. **Characters** - AI character management
3. **Documents** - Document storage and RAG support
4. **Images** - Image gallery and generation
5. **Settings** - Application configuration

### Routing Structure

```
app/
├── _layout.tsx           # Root layout with providers
├── +html.tsx            # Web-specific HTML template
├── +not-found.tsx       # 404 page
├── (tabs)/              # Tab navigation group
│   ├── _layout.tsx      # Tab navigation layout
│   ├── index.tsx        # Chat main screen
│   ├── characters.tsx   # Characters management
│   ├── documents.tsx    # Documents management
│   ├── images.tsx       # Image gallery
│   └── settings.tsx     # Settings screen
├── thread/[id].tsx      # Individual chat thread (mobile)
├── edit-character.tsx   # Character editing
└── settings/           # Settings subsections
    ├── export.tsx
    ├── font.tsx
    ├── general.tsx
    ├── help.tsx
    ├── logs.tsx
    ├── polaris.tsx
    ├── theme.tsx
    ├── tools.tsx
    └── providers/
```

### Chat Component Hierarchy

The chat system follows a hierarchical component structure:

```
ChatThread (Main chat interface)
└── ChatContainer (Chat wrapper with input)
    ├── MessageList (Scrollable message display)
    │   └── Message (Individual message component)
    │       ├── MessageActions (Copy, edit, etc.)
    │       ├── ThinkBlock (AI reasoning display)
    │       └── MentionedDocument (Document references)
    └── ChatInput (Message composition)
```

#### Component Responsibilities

- **ChatThread**: Top-level chat interface, handles desktop/mobile layout differences
- **ChatContainer**: Manages message display, input handling, and scroll behavior
- **MessageList**: Renders scrollable list of messages with virtualization
- **Message**: Individual message rendering with markdown, code blocks, and interactive elements
- **ChatInput**: Message composition with file attachments and mentions

### Platform-Specific Behavior

#### Desktop (Web)
- Displays `ChatThread` component directly with full interface
- Shows sidebar with chat threads list
- Desktop keyboard shortcuts (Alt + N for new chat)

#### Mobile
- Shows `ChatThreads` list on index screen
- Navigates to `/thread/[id]` route for individual conversations
- Touch-optimized interface

## State Management Architecture

### Atoms-Based State Management

Compass uses Jotai for state management with a custom async storage integration:

#### Core Atoms

```typescript
// Thread Management
threadsAtom                 // All chat threads
currentThreadIdAtom         // Current active thread ID
defaultThreadAtom          // Default thread template

// AI Models & Characters
availableModelsAtom        // Available AI models
charactersAtom            // User characters
selectedModelAtom         // Currently selected model

// Chat State
isGeneratingAtom          // AI response generation state
streamingMessageAtom      // Real-time streaming content
editingMessageIndexAtom   // Message being edited

// UI State
previewCodeAtom           // Code preview modal state
isDarkModeAtom           // Theme preference
fontPreferencesAtom      // Typography settings
```

#### Storage Strategy
- **Local First**: AsyncStorage for persistent data
- **Polaris Sync**: Optional cloud synchronization
- **Loadable Atoms**: Async data loading with suspense

### Data Flow

```
User Action → Component → Hook → Atom Update → Storage → UI Re-render
```

Example: Sending a message
1. User types in `ChatInput`
2. `useChat` hook processes input
3. Updates `threadsAtom` and `streamingMessageAtom`
4. `ChatContainer` re-renders with new message
5. AI provider streams response
6. Real-time updates via `streamingMessageAtom`

## AI Provider Architecture

### Provider Abstraction

The application uses a unified provider interface supporting multiple AI services:

```
ChatProviderFactory
├── VercelAIProvider (Primary - supports streaming, tools)
├── AnthropicProvider (Claude models)
├── OpenAIProvider (GPT models)
├── OllamaProvider (Local models)
├── GroqProvider (Fast inference)
├── MistralProvider (Mistral models)
├── XAIProvider (Grok models)
└── PolarisProvider (Custom backend)
```

### Provider Features
- **Streaming Support**: Real-time message generation
- **Tool Integration**: Function calling capabilities
- **Model Management**: Dynamic model discovery and selection
- **Error Handling**: Graceful fallbacks and retry logic

## Service Layer Architecture

### Core Services

```
src/services/
├── chat/                    # Chat management
│   ├── CharacterContextManager.ts
│   ├── ChatProviderFactory.ts
│   └── providers/          # AI provider implementations
├── character/              # Character management
├── document/               # Document processing & RAG
├── provider/               # Provider configuration
├── image/                  # Image generation & gallery
├── polaris/               # Cloud sync service
└── search/                # Web search integration
```

### Service Responsibilities

#### CharacterService
- Custom character creation and management
- Character prompts and personality configuration
- Model routing for characters

#### DocumentService
- Document upload and processing
- RAG (Retrieval Augmented Generation) implementation
- PDF and web content extraction

#### ProviderService
- AI provider configuration
- API key management
- Model discovery and availability

#### PolarisServer
- Cloud synchronization
- Cross-device data sync
- Backup and restore functionality

## Tools System

### Tool Architecture

Compass includes an extensible tool system for AI function calling:

```
src/tools/
├── tool.interface.ts      # Tool definition interface
├── registry.ts           # Tool registration
├── toolConfig.ts         # Tool configuration
├── calculator.tool.ts    # Mathematical calculations
├── documentSearch.tool.ts # RAG document search
├── email.tool.ts         # Email composition
├── image-generation.tool.ts # Image generation
├── note.tool.ts          # Note taking
├── websearch.tool.ts     # Web search
├── weather.tool.ts       # Weather information
└── location.tool.ts      # Location services
```

### Tool Interface

```typescript
interface ToolBlueprint {
  definition: ToolDefinition;
  handler: ToolHandler;
  config?: ToolConfig;
}
```

Tools integrate seamlessly with AI providers supporting function calling, allowing characters to:
- Search documents
- Generate images
- Take notes
- Send emails
- Perform calculations
- Get weather/location data

## Cross-Platform Build System

### Build Targets

- **Web**: Expo web build with serve/deploy options
- **Mobile**: Expo Application Services (EAS) for iOS/Android
- **Desktop**: Tauri for Linux and Windows
- **Container**: Docker for web deployment

### Build Commands

```bash
# Web development
npm run web                 # Development server
npm run build:web          # Production web build
npm run serve:web          # Serve built web app

# Mobile builds
npm run build:android       # Android APK via EAS
npm run build:android-local # Local Android build

# Desktop builds
npm run build:linux         # Linux AppImage
npm run build:windows       # Windows executable
npm run dev-tauri          # Desktop development

# Container deployment
docker build -t compass .   # Docker image build
```

## Data Models

### Core Types

```typescript
interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
  selectedModel?: Model;
  character?: Character;
  metadata?: {
    documentIds?: string[];
  };
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  character?: Character;
  toolCalls?: ToolCall[];
  reasoning?: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  prompt: string;
  image?: string;
  icon?: string;
  modelRouting?: ModelRouting[];
  documentIds?: string[];
}
```

## Security & Privacy

### Local-First Architecture
- **Data Sovereignty**: All data stored locally by default
- **Optional Cloud Sync**: Polaris integration for cross-device sync
- **No Telemetry**: No user data collection or tracking

### API Key Management
- Secure storage of provider API keys
- Local-only storage (not synced to cloud)
- Environment variable support for development

### Network Security
- HTTPS-only connections
- Proxy server for API requests
- Network security config for Android

## Development Workflow

### Project Structure

```
compass/
├── app/                   # Expo Router pages
├── assets/               # Static assets (images, fonts)
├── constants/           # App constants and themes
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── screens/        # Screen components (legacy)
│   ├── services/       # Business logic services
│   ├── tools/          # AI tools implementation
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── scripts/            # Build and utility scripts
├── docs/               # Documentation
└── windows/            # Windows-specific build files
```

### Development Guidelines

1. **Component Organization**: Group by feature, not by type
2. **State Management**: Use atoms for global state, local state for component-specific data
3. **Type Safety**: Comprehensive TypeScript coverage
4. **Platform Compatibility**: Test on web, mobile, and desktop
5. **Performance**: Lazy loading, memoization, and virtualization

## Future Architecture Considerations

### Planned Enhancements

1. **Voice Integration**
   - Speech-to-Text (STT) input
   - Text-to-Speech (TTS) output
   - Real-time voice conversations

2. **Advanced Tool System**
   - User-defined custom tools
   - Toolsmith: AI-assisted tool creation
   - Manager: AI-driven character management

3. **Enhanced RAG**
   - Vector database integration
   - Advanced document processing
   - Semantic search improvements

4. **Collaboration Features**
   - Shared threads
   - Team workspaces
   - Real-time collaboration

This architecture provides a solid foundation for a modern, scalable, and maintainable AI chat application with strong cross-platform capabilities and extensible functionality.
