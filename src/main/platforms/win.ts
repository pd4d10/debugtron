import fs from "fs";
import path from "path";
import {
  enumerateKeys,
  enumerateValues,
  HKEY,
  type RegistryStringEntry,
  type RegistryValue,
  RegistryValueType,
} from "registry-js";
import { Result } from "ts-results";
import type { AppInfo } from "../../reducers/app";
import type { AppReader } from "./utils";

async function getAppInfoByExePath(
  exePath: string,
  iconPath: string,
  values: readonly RegistryValue[],
): Promise<AppInfo> {
  const displayName = values.find(
    (v): v is RegistryStringEntry => v && v.type === RegistryValueType.REG_SZ && v.name === "DisplayName",
  );
  let icon = "";
  if (iconPath) {
    const iconBuffer = await fs.promises.readFile(iconPath);
    icon = "data:image/x-icon;base64," + iconBuffer.toString("base64");
  }
  return {
    id: exePath,
    name: displayName ? displayName.data : path.basename(exePath, ".exe"),
    icon: icon,
    exePath: exePath,
  };
}

const getAppInfoFromRegeditItemValues = async (
  values: readonly RegistryValue[],
) => {
  let iconPath = "";

  // Try to find executable path of Electron app
  const displayIcon = values.find(
    (v): v is RegistryStringEntry => v && v.type === RegistryValueType.REG_SZ && v.name === "DisplayIcon",
  );

  if (displayIcon) {
    const [icon] = displayIcon.data.split(",");
    if (icon?.toLowerCase().endsWith(".exe")) {
      if (!isElectronApp(path.dirname(icon))) {
        throw new Error("not and electron app");
      }
      return getAppInfoByExePath(icon, iconPath, values);
    } else if (icon?.toLowerCase().endsWith(".ico")) {
      iconPath = icon;
    }
  }

  let installDir = "";

  const installLocation = values.find(
    (v): v is RegistryStringEntry => v && v.type === RegistryValueType.REG_SZ && v.name === "InstallLocation",
  );

  if (installLocation && installLocation.data) {
    installDir = installLocation.data;
  } else if (iconPath) {
    installDir = path.dirname(iconPath);
  }

  if (installDir) {
    const exeFile = await findExeFile(installDir);
    if (exeFile) {
      return getAppInfoByExePath(exeFile, iconPath, values);
    } else {
      const files = await fs.promises.readdir(installDir);
      const semverDir = files.find((file) => /\d+\.\d+\.\d+/.test(file));
      if (semverDir) {
        const exeFile = await findExeFile(path.join(installDir, semverDir));
        if (exeFile) {
          return getAppInfoByExePath(exeFile, iconPath, values);
        }
      }
    }
  }

  throw new Error("app not found");
};

function isElectronApp(installDir: string) {
  return (
    fs.existsSync(path.join(installDir, "resources"))
    && [
      "electron.asar",
      // https://github.com/pd4d10/debugtron/pull/26
      "default_app.asar",
      "app.asar",
      "app.asar.unpacked",
      "app",
    ].some((file) => fs.existsSync(path.join(installDir, "resources", file)))
  );
}

async function findExeFile(dir: string) {
  if (isElectronApp(dir)) {
    const files = await fs.promises.readdir(dir);
    const [exeFile] = files.filter((file) => {
      const lc = file.toLowerCase();
      return (
        lc.endsWith(".exe")
        && !["uninstall", "update"].some((keyword) => lc.includes(keyword))
      );
    });
    if (exeFile) return path.join(dir, exeFile);
  }
}

export const adapter: AppReader = {
  readAll: () =>
    Result.wrapAsync(async () => {
      const enumRegeditItems = (key: HKEY, subkey: string) => {
        return enumerateKeys(key, subkey).map((k) => enumerateValues(key, subkey + "\\" + k));
      };

      const items = [
        ...enumRegeditItems(
          HKEY.HKEY_LOCAL_MACHINE,
          "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
        ),
        ...enumRegeditItems(
          HKEY.HKEY_LOCAL_MACHINE,
          "Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
        ),
        ...enumRegeditItems(
          HKEY.HKEY_CURRENT_USER,
          "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
        ),
      ];

      const results = await Promise.all(
        items.map((itemValues) => Result.wrapAsync(async () => getAppInfoFromRegeditItemValues(itemValues))),
      );

      const apps = results.flatMap((app) => (app.ok ? [app.unwrap()] : []));

      return apps;
    }),

  readByPath: (p: string) =>
    Result.wrapAsync(async () => {
      if (path.extname(p).toLowerCase() === ".exe") {
        throw new Error("should be suffixed with exe");
      }

      return {
        id: p,
        name: path.basename(p, ".exe"),
        icon: "",
        exePath: p,
      };
    }),
};
