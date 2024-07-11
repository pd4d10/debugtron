import { findExecPath } from "./linux/find-exec";
import { findIconPath } from "./linux/find-icon";
import type { AppReader } from "./utils";
import fs from "fs";
import ini from "ini";
import os from "os";
import path from "path";
import { Result } from "ts-results";

const userAppsDir = path.join(os.homedir(), ".local/share/applications");
const sysAppsDir = "/usr/share/applications";

const readAppInfo = (desktopFile: string) =>
  Result.wrapAsync(async () => {
    const content = await fs.promises.readFile(desktopFile, {
      encoding: "utf-8",
    });
    const entry = ini.parse(content)["Desktop Entry"] as
      | {
          Name?: string;
          Icon?: string;
          Exec?: string;
        }
      | undefined;

    if (!entry?.Exec) throw new Error("Exec not found");

    let exePath = "";
    if (entry.Exec.startsWith('"')) {
      exePath = entry.Exec.replace(/^"(.*)".*/, "$1");
    } else {
      // Remove arg
      exePath = entry.Exec.split(/\s+/)[0] ?? "";
    }

    // try to find real exec file
    if (!path.isAbsolute(exePath)) {
      exePath = findExecPath(exePath) || exePath;
    }

    if (!path.isAbsolute(exePath)) {
      throw new Error("Exec path invalid");
    }

    if (
      !(
        fs.existsSync(path.join(exePath, "../resources/electron.asar")) ||
        fs.existsSync(path.join(exePath, "../LICENSE.electron.txt")) ||
        fs.existsSync(path.join(exePath, "../chrome-sandbox"))
      )
    ) {
      throw new Error("resources/electron.asar not exists");
    }

    let icon = "";
    let iconPath = ""; // todo: set default icon
    if (entry.Icon) {
      if (path.isAbsolute(entry.Icon)) {
        iconPath = entry.Icon;
      } else {
        iconPath = findIconPath(entry.Icon) || iconPath;
      }

      if (fs.existsSync(iconPath)) {
        const base64 = await fs.promises.readFile(iconPath, "base64");

        const ext = path.extname(iconPath);
        if (ext === ".svg") {
          icon = "data:image/svg+xml;base64," + base64;
        }
        if (ext === ".png") {
          icon = "data:image/png;base64," + base64;
        }
        // todo: if (ext === 'xpm') {}
      }
    }

    return {
      id: exePath,
      icon: icon, // TODO: Read icon
      name: entry.Name || path.basename(exePath),
      exePath: exePath,
    };
  });

async function readAppDir(dir: string) {
  const files = await fs.promises.readdir(dir);
  const apps = await Promise.all(
    files
      .filter((f) => f.endsWith(".desktop"))
      .map((file) => readAppInfo(path.join(dir, file))),
  );
  return apps.flatMap((app) => (app.ok ? [app.unwrap()] : []));
}

export const adapter: AppReader = {
  readAll: () =>
    Result.wrapAsync(async () => {
      const userApps = await readAppDir(userAppsDir);
      const sysApps = await readAppDir(sysAppsDir);
      return [...userApps, ...sysApps];
    }),
  readByPath: (p: string) =>
    Result.wrapAsync(async () => {
      // TODO:
      return {
        id: p,
        name: path.basename(p),
        icon: "",
        exePath: p,
      };
    }),
};
