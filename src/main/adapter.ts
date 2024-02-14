import { LinuxAdapter } from "./linux";
import { MacosAdapter } from "./macos";
import { WinAdapter } from "./win";

export function getAdapter() {
  switch (process.platform) {
    case "win32":
      return new WinAdapter();
    case "darwin":
      return new MacosAdapter();
    case "linux":
      return new LinuxAdapter();
    default:
      throw new Error("platform not supported");
  }
}
