import fs from "fs";
import { machineId } from "node-machine-id";
import os from "os";
// import { setUpdateNotification } from 'electron-update-notification' // TODO:
import plist from "simple-plist";
import ua from "universal-analytics";

interface MacosAppInfo {
  CFBundleIdentifier: string;
  CFBundleName: string;
  CFBundleExecutable: string;
  CFBundleIconFile: string;
}

export async function readdirSafe(p: string) {
  try {
    return await fs.promises.readdir(p);
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function readFileSafe(p: string) {
  try {
    return await fs.promises.readFile(p, { encoding: "utf8" });
  } catch (err) {
    console.error(err);
    return "";
  }
}

export async function readFileAsBufferSafe(p: string) {
  try {
    return await fs.promises.readFile(p);
  } catch (err) {
    console.error(err);
    return;
  }
}

export async function readPlistFile(path: string): Promise<MacosAppInfo> {
  return new Promise((resolve, reject) => {
    plist.readFile<MacosAppInfo>(path, (error, data) => {
      // console.log(error, data)

      if (error || !data) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

export async function setReporter() {
  try {
    const id = await machineId();
    const client = ua("UA-145047249-4", id, { strictCidFormat: false });
    client.pageview("/" + require("../../package.json").version).send();
  } catch (err) {}
}

export async function setUpdater() {
  switch (os.platform()) {
    // case 'win32':
    //   require('update-electron-app')()
    //   break
    // TODO: macOS: Make code sign work then use update-electron-app
    default:
    // setUpdateNotification({
    //   token: DEBUGTRON_GITHUB_TOKEN,
    // });
  }
}
