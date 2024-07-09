import { machineId } from "node-machine-id";
import os from "os";
// import { setUpdateNotification } from 'electron-update-notification' // TODO:
import ua from "universal-analytics";

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
    // setUpdateNotification();
  }
}
