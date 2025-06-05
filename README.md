# Welcome to Compass <img src="/assets/compass.png" alt="Compass Logo" height="50" /> 

Compass is a modern, open-source Large Language Model (LLM) client designed to provide a seamless AI chat experience across multiple platforms. Built with React Native and Expo, it offers a rich set of features while maintaining high performance and user experience.
The goal is to promote private, decentralized AI - whilst also maintaining access to cloud-based AI through API's for those who need or prefer it.

Download from [latest release](https://github.com/compass-ai-chat/compass/releases/tag/v1.0.1)
Try it out [here](https://compass-ai.chat/compass) (only for demo)

<p align="center">
<img src="https://github.com/user-attachments/assets/f95389af-4378-466f-87e2-142638c1f422" alt="Compass Desktop" height="300" />
   &nbsp;&nbsp;&nbsp;&nbsp;
<img src="https://github.com/user-attachments/assets/02f206c1-9522-4264-bb18-c6f3cde8e152" alt="Compass Mobile" height="300"/>
</p>


## Features

- 🌐 **Cross-Platform**: Buildable for iOS, Android, Linux and web
- 🔍 **Auto-scanning for Ollama instances on network**: Just connect to the same network and Compass will find it with the press of a button.
- 🤖 **Multiple LLM Providers**: Support for OpenAI, Anthropic, Ollama, and more
- 👥 **Character System**: Built-in characters and support for custom character creation
- 💬 **Chat History**: Persistent conversation tracking and management
- 🎨 **Modern UI**: Clean, responsive interface with multiple themes built in
- 🔍 **Web search**: Paste URL's into chat to ask question about them. Automatic web search integration using SearxNg
- 🖼️ **Image Generation**: Generate images from text prompts (currently only supports Replicate)
- 📁 **Image Gallery**: View images that have been generated
- 🖥️ **Desktop Shortcut**: Alt + N to open a new chat
- 📝 **Code Preview**: Preview generated html, css and javascript in a separate window
- 🔍 **RAG Support**: Upload documents and attach these to characters, who can then use them for their conversations

## Roadmap

- 🎤 **Speech-to-Text (STT)**: Voice input capabilities
- 📞 **Voice Calls**: Real-time voice conversations with AI
- 📸 **Vision Integration**: Camera support for vision model capabilities
- ⚙️ **Custom Filters**: Self-programmable filters and data processing pipes
- 🗣️ **Text-to-Speech (TTS)**: Natural voice output for AI responses (currently only supports ElevenLabs)

# Installation 

## Docker
To pull and run the Docker image:

```bash
docker pull ghcr.io/nordwestt/compass:latest
docker run --network host -p 80:80 ghcr.io/nordwestt/compass:latest
```

Then you can use compass by visiting "http://localhost/compass" in your browser.
The proxy server will be available on port 3001.


# Development

## Get Started

It is recommended that you install Ollama and open up access, following the [guide](https://github.com/nordwestt/compass/wiki/Ollama) 

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   nvm use 22.11.0
   npx expo start
   ```

You can run the app using:

- [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) - Full feature access
- [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/) - For Android development
- [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/) - For iOS development
- [Expo Go](https://expo.dev/go) - Quick testing and development

## Building app for Linux

First install the prerequisites: https://v2.tauri.app/start/prerequisites/

Then run:

```bash
nvm use 18.19.0
npm run build:linux
```

## Building app for Docker

```bash
docker build -t my-app .
```
then you can run it with:

```bash
docker run -p 80:80 my-app
```

Make sure to update proxy in Settings to "http://<your-docker-app>/proxy"


## Contributing

I don't currently accept contributions since I'm still working on the core functionality, but I welcome feedback and suggestions for now!
