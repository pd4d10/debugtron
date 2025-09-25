import os from "os";
import packageJson from "../../package.json";

import { machineId } from "node-machine-id";
// import { setUpdateNotification } from 'electron-update-notification' // TODO:
import ua from "universal-analytics";

export async function setReporter() {
  try {
    const id = await machineId();
    const client = ua("UA-145047249-4", id, { strictCidFormat: false });
    client.pageview("/" + packageJson.version).send();
  } catch {}
}

export function setUpdater() {
  switch (os.platform()) {
    // case 'win32':
    //   require('update-electron-app')()
    //   break
    // TODO: macOS: Make code sign work then use update-electron-app
    default:
      // setUpdateNotification();
  }
}
