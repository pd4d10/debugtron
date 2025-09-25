import { contextBridge, ipcRenderer } from "electron";
// Keep electron-redux for state synchronization
import { preload } from "electron-redux/preload";

preload();

/**
 * Helper function to create IPC send methods
 */
function createIPCSender(channel: string) {
  return (...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  };
}

/**
 * Helper function to create event listeners
 */
function createEventListener(channel: string) {
  return (callback: (event: unknown, ...args: unknown[]) => void) => {
    const wrappedCallback = (event: unknown, ...args: unknown[]) => {
      callback(event, ...args);
    };
    ipcRenderer.on(channel, wrappedCallback);
    return () => ipcRenderer.removeListener(channel, wrappedCallback);
  };
}

/**
 * Helper function to create utility methods
 */
function createUtilityMethods() {
  return {
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  };
}

// Define the API implementation using builders
const debugtronAPI = {
  // App debugging operations
  debug: createIPCSender("debug"),
  debugPath: createIPCSender("debug-path"),

  // DevTools operations
  openDevTools: createIPCSender("open-devtools"),

  // General window operations
  openWindow: createIPCSender("open-window"),

  // Event listeners (for future use)
  onSessionUpdate: createEventListener("session-updated"),

  // Utility methods
  ...createUtilityMethods(),
} as const;

// Export the type for use in renderer process
export type DebugTronAPI = typeof debugtronAPI;

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld("debugtronAPI", debugtronAPI);
