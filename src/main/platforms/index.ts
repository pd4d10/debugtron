export function importByPlatform() {
  switch (process.platform) {
    case "win32":
      return import("../platforms/win");
    case "darwin":
      return import("./macos");
    case "linux":
      return import("./linux");
    default:
      throw new Error("platform not supported");
  }
}
