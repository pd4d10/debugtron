import os from 'os'
import { setUpdateNotification } from 'electron-update-notification'

export async function setUpdater() {
  switch (os.platform()) {
    case 'win32':
      require('update-electron-app')()
      break
    // TODO: macOS: Make code sign work then use update-electron-app
    default:
      setUpdateNotification({
        token: DEBUGTRON_GITHUB_TOKEN,
      })
  }
}
