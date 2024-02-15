import type { AppReader } from "./utils";
import fs from "fs";
import ini from "ini";
import path from "path";
import { Result } from "ts-results";

const desktopFilesDir = "/usr/share/applications";

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

    if (!exePath.startsWith("/")) {
      throw new Error("Exec path invalid");
    }
    if (!fs.existsSync(path.join(exePath, "../resources/electron.asar"))) {
      throw new Error("resources/electron.asar not exists");
    }

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
  });

export const adapter: AppReader = {
  readAll: () =>
    Result.wrapAsync(async () => {
      const files = await fs.promises.readdir(desktopFilesDir);
      const apps = await Promise.all(
        files
          .filter((f) => f.endsWith(".desktop"))
          .map((file) => readAppInfo(path.join(desktopFilesDir, file))),
      );
      return apps.flatMap((app) => (app.ok ? [app.unwrap()] : []));
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
