export function importByPlatform() {
  switch (process.platform) {
    case "win32":
      return import("../platforms/win");
    case "darwin":
      return import("../platforms/macos");
    case "linux":
      return import("../platforms/linux");
    default:
      throw new Error("platform not supported");
  }
}
