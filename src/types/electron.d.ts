import type { DebugTronAPI } from "../preload";

declare global {
  interface Window {
    debugtronAPI: DebugTronAPI;
  }
}
