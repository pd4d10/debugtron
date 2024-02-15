import { readdirSafe, readFileSafe } from "../main/utils";
import type { AppInfo } from "../reducers/app";
import type { AppReader } from "./utils";
import fs from "fs";
import ini from "ini";
import path from "path";

const desktopFilesDir = "/usr/share/applications";

async function readAppInfo(desktopFile: string): Promise<AppInfo | undefined> {
  const content = await readFileSafe(desktopFile);

  const entry = ini.parse(content)["Desktop Entry"] as {
    Name?: string;
    Icon?: string;
    Exec?: string;
  };
  if (!entry || !entry.Exec) return;

  let exePath = "";
  if (entry.Exec.startsWith('"')) {
    exePath = entry.Exec.replace(/^"(.*)".*/, "$1");
  } else {
    // Remove arg
    exePath = entry.Exec.split(/\s+/)[0] ?? "";
  }

  if (!exePath.startsWith("/")) return;

  if (!fs.existsSync(path.join(exePath, "../resources/electron.asar"))) return;

  let icon = "";
  if (entry.Icon) {
    try {
      const iconBuffer = await fs.promises.readFile(
        `/usr/share/icons/hicolor/1024x1024/apps/${entry.Icon}.png`,
      );
      icon = "data:image/png;base64," + iconBuffer.toString("base64");
    } catch (err) {
      console.error(err);
    }
  }

  return {
    id: exePath,
    icon: icon, // TODO: Read icon
    name: entry.Name || path.basename(exePath),
    exePath: exePath,
  };
}

export const adapter: AppReader = {
  async readAll() {
    const files = await readdirSafe(desktopFilesDir);
    const apps = await Promise.all(
      files.map((file) => {
        if (!file.endsWith(".desktop")) return;
        return readAppInfo(path.join(desktopFilesDir, file));
      }),
    );
    return apps;
  },
  async readByPath(p: string) {
    return {
      id: p,
      name: path.basename(p),
      icon: "",
      exePath: p,
    };
  },
};
