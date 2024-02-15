import { readdirSafe } from "../main/utils";
import type { AppInfo } from "../reducers/app";
import type { AppReader } from "./utils";
import fs from "fs";
import path from "path";
import {
  HKEY,
  type RegistryValue,
  type RegistryStringEntry,
  RegistryValueType,
  enumerateKeys,
  enumerateValues,
} from "registry-js";

async function getAppInfoByExePath(
  exePath: string,
  iconPath: string,
  values: readonly RegistryValue[],
): Promise<AppInfo> {
  const displayName = values.find(
    (v): v is RegistryStringEntry =>
      v && v.type === RegistryValueType.REG_SZ && v.name === "DisplayName",
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

async function getAppInfoFromRegeditItemValues(
  values: readonly RegistryValue[],
): Promise<AppInfo | undefined> {
  if (values.length === 0) return;

  let iconPath = "";

  // Try to find executable path of Electron app
  const displayIcon = values.find(
    (v): v is RegistryStringEntry =>
      v && v.type === RegistryValueType.REG_SZ && v.name === "DisplayIcon",
  );

  if (displayIcon) {
    const [icon] = displayIcon.data.split(",");
    if (icon?.toLowerCase().endsWith(".exe")) {
      if (!isElectronApp(path.dirname(icon))) return;
      return getAppInfoByExePath(icon, iconPath, values);
    } else if (icon?.toLowerCase().endsWith(".ico")) {
      iconPath = icon;
    }
  }

  let installDir = "";

  const installLocation = values.find(
    (v): v is RegistryStringEntry =>
      v && v.type === RegistryValueType.REG_SZ && v.name === "InstallLocation",
  );

  if (installLocation && installLocation.data) {
    installDir = installLocation.data;
  } else if (iconPath) {
    installDir = path.dirname(iconPath);
  }

  if (!installDir) return;

  const exeFile = await findExeFile(installDir);
  if (exeFile) {
    return getAppInfoByExePath(exeFile, iconPath, values);
  } else {
    const files = await readdirSafe(installDir);
    const semverDir = files.find((file) => /\d+\.\d+\.\d+/.test(file));
    if (!semverDir) return;

    const exeFile = await findExeFile(path.join(installDir, semverDir));
    if (!exeFile) return;

    return getAppInfoByExePath(exeFile, iconPath, values);
  }
}

function isElectronApp(installDir: string) {
  return (
    fs.existsSync(path.join(installDir, "resources")) &&
    ["electron.asar", "app.asar", "app.asar.unpacked"].some((file) =>
      fs.existsSync(path.join(installDir, "resources", file)),
    )
  );
}

async function findExeFile(dir: string) {
  if (isElectronApp(dir)) {
    const files = await readdirSafe(dir);
    const [exeFile] = files.filter((file) => {
      const lc = file.toLowerCase();
      return (
        lc.endsWith(".exe") &&
        !["uninstall", "update"].some((keyword) => lc.includes(keyword))
      );
    });
    if (exeFile) return path.join(dir, exeFile);
  }
}

export const adapter: AppReader = {
  async readAll() {
    const enumRegeditItems = (key: HKEY, subkey: string) => {
      return enumerateKeys(key, subkey).map((k) =>
        enumerateValues(key, subkey + "\\" + k),
      );
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
    return Promise.all(
      items.map((itemValues) => getAppInfoFromRegeditItemValues(itemValues)),
    );
  },

  async readByPath(p: string) {
    if (path.extname(p).toLowerCase() != ".exe") return;

    return {
      id: p,
      name: path.basename(p, ".exe"),
      icon: "",
      exePath: p,
    };
  },
};
