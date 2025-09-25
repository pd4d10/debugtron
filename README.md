# Debugtron

[![lint](https://github.com/pd4d10/debugtron/workflows/lint/badge.svg)](https://github.com/pd4d10/debugtron/actions)

Debugtron is a powerful desktop debugging tool for in-production Electron applications. Built with Electron, React, and TypeScript, it provides a comprehensive interface to discover, launch, and debug any Electron app with professional DevTools integration.

![Screenshot](assets/0.png)

## ✨ Features

- **🔍 Automatic App Discovery**: Cross-platform detection of installed Electron applications with visual interface
- **🚀 One-Click Debug Sessions**: Launch any Electron app with debugging flags enabled, support multiple simultaneous sessions
- **🛠️ DevTools Integration**: Access Chrome DevTools for both Node.js main process and renderer processes
- **📊 Real-Time Monitoring**: Live stdout/stderr logging with professional terminal interface

## 🎯 Use Cases

- **Development & Testing**: Debug production builds, profile performance, and validate features
- **Production Support**: Investigate deployed app issues and reproduce customer problems
- **Quality Assurance**: Test apps without built-in debugging across different platforms

## 📦 Installation

Download the latest release for your platform:

**[📥 Download from GitHub Releases](https://github.com/pd4d10/debugtron/releases)**

### Supported Platforms

- **Windows** (x64)
- **macOS** (Intel & Apple Silicon)
- **Linux** (x64, AppImage)

## 🚀 Quick Start

1. **Launch Debugtron** - Open the application
2. **Select an App** - Choose from automatically discovered Electron applications
3. **Start Debugging** - Click to launch the app with debugging enabled
4. **Open DevTools** - Click "Inspect" buttons to open DevTools for different processes
5. **Monitor Logs** - View real-time application output in the integrated terminal

## 🔧 Development

### Prerequisites

- Node.js 18+
- Yarn package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/pd4d10/debugtron.git
cd debugtron

# Install dependencies
yarn install

# Start development
yarn dev

# Build for production
yarn build

# Package for distribution
yarn package
```

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── actions.ts  # Redux thunk actions
│   ├── platforms/  # Platform-specific app discovery
│   └── main.ts     # Main entry point
├── renderer/       # React frontend
│   ├── app.tsx     # Main app component
│   ├── session.tsx # Debug session interface
│   └── header.tsx  # App selection header
├── reducers/       # Redux state management
└── preload.ts      # Secure IPC preload script
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines

- Use TypeScript with strict mode
- Follow the existing code style and patterns
- Write clear commit messages
- Test on multiple platforms when possible

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
