import fs from 'fs'
import path from 'path'
import plist from 'plist'
import { v4 } from 'uuid'
import { spawn } from 'child_process'
import { AppInfo } from '../types'
import { Store } from 'redux'
import {
  updateNodePort,
  updateWindowPort,
  addSession,
  updateLog,
  removeSession,
} from '../reducers/session'
import { State } from '../reducers'
import { dialog } from 'electron'
import {
  enumerateKeys,
  HKEY,
  enumerateValues,
  RegistryValue,
  RegistryValueType,
  RegistryStringEntry,
} from 'registry-js'

export const readIcnsAsImageUri = async (file: string) => {
  let buf = await fs.promises.readFile(file)
  const totalSize = buf.readInt32BE(4) - 8
  buf = buf.slice(8)

  const icons = []

  let start = 0
  while (start < totalSize) {
    const type = buf.slice(start, start + 4).toString()
    const size = buf.readInt32BE(start + 4)
    const data = buf.slice(start + 8, start + size)

    icons.push({ type, size, data })
    start += size
  }

  icons.sort((a, b) => b.size - a.size)
  const imageData = icons[0].data
  if (imageData.slice(1, 4).toString() === 'PNG') {
    return 'data:image/png;base64,' + imageData.toString('base64')
  }

  // TODO: other image type
  return ''
}

async function readdirAbsolute(dir: string) {
  try {
    const dirs = await fs.promises.readdir(dir)
    return dirs.map(file => path.join(dir, file))
  } catch (err) {
    return []
  }
}

async function getAppInfoFromRegeditItemValues(
  values: readonly RegistryValue[],
): Promise<AppInfo | undefined> {
  if (values.length === 0) return

  let exePath = ''
  let iconPath = ''

  // Try to find executable path of Electron app
  const displayIcon = values.find(
    (v): v is RegistryStringEntry =>
      v && v.type === RegistryValueType.REG_SZ && v.name === 'DisplayIcon',
  )

  if (displayIcon) {
    const icon = displayIcon.data.split(',')[0]
    if (icon.toLowerCase().endsWith('.exe')) {
      if (fs.existsSync(path.join(icon, '../resources/electron.asar'))) {
        exePath = icon
      } else {
        return
      }
    } else if (icon.toLowerCase().endsWith('.ico')) {
      iconPath = icon
    }
  } else {
    const installLocation = values.find(
      (v): v is RegistryStringEntry =>
        v &&
        v.type === RegistryValueType.REG_SZ &&
        v.name === 'InstallLocation',
    )
    if (installLocation) {
      const dir = installLocation.data
      let files: string[] = []
      try {
        files = await fs.promises.readdir(dir)
      } catch (err) {
        console.error(err, typeof dir)
      }

      if (fs.existsSync(path.join(dir, 'resources/electron.asar'))) {
        const exeFiles = files.filter(file => {
          const lc = file.toLowerCase()
          return (
            lc.endsWith('.exe') &&
            !['uninstall', 'update'].some(keyword => lc.includes(keyword))
          )
        })
        if (exeFiles.length) {
          exePath = exeFiles[0] // FIXME:
        }
      } else {
        const semverDir = files.find(file => /\d+\.\d+\.\d+/.test(file))
        if (
          semverDir &&
          fs.existsSync(path.join(dir, semverDir, 'resources/electron.asar'))
        ) {
          const exeFiles = files.filter(file => {
            const lc = file.toLowerCase()
            return (
              lc.endsWith('.exe') &&
              !['uninstall', 'update'].some(keyword => lc.includes(keyword))
            )
          })
          if (exeFiles.length) {
            exePath = exeFiles[0] // FIXME:
          }
        }
      }
    }
  }

  if (exePath) {
    const displayName = values.find(
      (v): v is RegistryStringEntry =>
        v && v.type === RegistryValueType.REG_SZ && v.name === 'DisplayName',
    )
    let icon = ''
    if (iconPath) {
      const iconBuffer = await fs.promises.readFile(iconPath)
      icon = 'data:image/x-icon;base64,' + iconBuffer.toString('base64')
    }
    return {
      id: exePath,
      name: displayName ? displayName.data : path.basename(exePath, '.exe'),
      icon: icon,
      exePath: exePath,
    }
  }
}

// win: exe path
// macOS: application path
export async function getAppInfoByDnd(p: string): Promise<AppInfo | undefined> {
  switch (process.platform) {
    case 'win32':
      if (path.extname(p).toLowerCase() != '.exe') return

      return {
        id: v4(), // TODO: get app id from register
        name: path.basename(p, '.exe'),
        icon: '',
        exePath: p,
      }
    case 'darwin':
      return getMacOsAppInfo(p)
    default:
      return
  }
}

export async function getMacOsAppInfo(
  appPath: string,
): Promise<AppInfo | undefined> {
  const isElectronBased = fs.existsSync(
    path.join(appPath, 'Contents/Frameworks/Electron Framework.framework'),
  )
  if (!isElectronBased) return

  const infoContent = await fs.promises.readFile(
    path.join(appPath, 'Contents/Info.plist'),
    { encoding: 'utf8' },
  )
  const info = plist.parse(infoContent) as {
    CFBundleIdentifier: string
    CFBundleName: string
    CFBundleExecutable: string
    CFBundleIconFile: string
  }

  const icon = await readIcnsAsImageUri(
    path.join(appPath, 'Contents', 'Resources', info.CFBundleIconFile),
  )

  return {
    id: info.CFBundleIdentifier,
    name: info.CFBundleName,
    icon,
    exePath: path.resolve(appPath, 'Contents/MacOS', info.CFBundleExecutable),
  }
}

export async function startDebugging(app: AppInfo, store: Store<State>) {
  const sp = spawn(app.exePath, [`--inspect=0`, `--remote-debugging-port=0`])

  const id = v4()
  store.dispatch(addSession(id, app.id))

  sp.on('error', err => {
    dialog.showErrorBox(`Error: ${app.name}`, err.message)
  })

  sp.on('close', code => {
    // console.log(`child process exited with code ${code}`)
    store.dispatch(removeSession(id))
    // TODO: Remove temp app
  })

  const handleStdout = (isError = false) => (chunk: Buffer) => {
    const data = chunk.toString()
    const session = store.getState().sessionInfo[id]

    // Try to find listening port from log
    if (!session.nodePort) {
      const match = /Debugger listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      if (match) {
        store.dispatch(updateNodePort(id, match[1]))
      }
    }
    if (!session.windowPort) {
      const match = /DevTools listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      if (match) {
        store.dispatch(updateWindowPort(id, match[1]))
      }
    }

    // TODO: stderr colors
    store.dispatch(updateLog(id, data))
  }

  if (sp.stdout) {
    sp.stdout.on('data', handleStdout())
  }
  if (sp.stderr) {
    sp.stderr.on('data', handleStdout(true))
  }
}

function enumRegeditItems(key: HKEY, subkey: string) {
  return enumerateKeys(key, subkey).map(k =>
    enumerateValues(key, subkey + '\\' + k),
  )
}

// Detect Electron apps
export async function getElectronApps(): Promise<(AppInfo | undefined)[]> {
  switch (process.platform) {
    case 'win32': {
      const items = [
        ...enumRegeditItems(
          HKEY.HKEY_LOCAL_MACHINE,
          'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        ),
        ...enumRegeditItems(
          HKEY.HKEY_CURRENT_USER,
          'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        ),
      ]
      // FIXME: 32-bit
      return Promise.all(
        items.map(itemValues => getAppInfoFromRegeditItemValues(itemValues)),
      )
    }
    case 'darwin': {
      const appPaths = await readdirAbsolute('/Applications')
      return Promise.all(appPaths.map(p => getMacOsAppInfo(p)))
    }
    default:
      return []
  }
}
