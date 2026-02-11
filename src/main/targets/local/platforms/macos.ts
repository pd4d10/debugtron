import { execFile } from "child_process";
import fs from "fs";
import path from "path";

import type { AppReader } from "./utils";

interface MacosAppInfo {
  CFBundleIdentifier: string;
  CFBundleName: string;
  CFBundleExecutable: string;
  CFBundleIconFile: string;
}

async function readPlistFile(filePath: string): Promise<MacosAppInfo> {
  return new Promise<MacosAppInfo>((resolve, reject) => {
    // Use macOS built-in plutil to convert plist to JSON
    execFile(
      "plutil",
      ["-convert", "json", "-o", "-", filePath],
      (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          try {
            resolve(JSON.parse(stdout) as MacosAppInfo);
          } catch (parseError) {
            reject(parseError);
          }
        }
      },
    );
  });
}

async function readIcnsAsImageUri(file: string) {
  let buf = await fs.promises.readFile(file);

  const totalSize = buf.readInt32BE(4) - 8;
  buf = buf.subarray(8);

  const icons = [];

  let start = 0;
  while (start < totalSize) {
    const type = buf.subarray(start, start + 4).toString();
    const size = buf.readInt32BE(start + 4);
    const data = buf.subarray(start + 8, start + size);

    icons.push({ type, size, data });
    start += size;
  }

  icons.sort((a, b) => b.size - a.size);
  const imageData = icons[0]?.data;
  if (imageData?.subarray(1, 4).toString() === "PNG") {
    return "data:image/png;base64," + imageData.toString("base64");
  }

  // TODO: other image type
  return "";
}

export const adapter: AppReader = {
  readAll: async () => {
    const dir = "/Applications";
    const appPaths = await fs.promises.readdir(dir);
    const results = await Promise.allSettled(
      appPaths.map((p) => adapter.readByPath(path.join(dir, p))),
    );
    return results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );
  },
  readByPath: async (p: string) => {
    const isElectronBased = fs.existsSync(
      path.join(p, "Contents/Frameworks/Electron Framework.framework"),
    );
    if (!isElectronBased) throw new Error("Not an electron app");

    const info = await readPlistFile(path.join(p, "Contents/Info.plist"));
    const icon = await readIcnsAsImageUri(
      path.join(p, "Contents/Resources", info.CFBundleIconFile),
    );

    return {
      id: info.CFBundleIdentifier,
      name: info.CFBundleName,
      icon,
      exePath: path.resolve(p, "Contents/MacOS", info.CFBundleExecutable),
    };
  },
};
