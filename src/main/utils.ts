import fs from 'fs'
import path from 'path'
import plist from 'plist'
import { v4 } from 'uuid'
import { spawn } from 'child_process'
import { AppInfo, Dict } from '../types'
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
import { promisify } from 'util'
import { list } from '../vendor/regedit'

const regeditList = promisify(list)

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

async function readWindowsApps(uninstallPath: string, arch: string) {
  const data = await regeditList(uninstallPath, arch)
  const obj = await regeditList(
    Object.values(data)
      .map((x, i) => {
        if (!x.keys) return []
        return x.keys.map(k => path.join(uninstallPath, k))
      })
      .flat(),
    arch,
  )

  let apps: AppInfo[] = []
  for (let item of Object.values(obj)) {
    const app = item.values
    if (!app) continue

    let iconPath = ''
    let installPath = ''

    if (app.DisplayIcon) {
      const icon = app.DisplayIcon.value.split(',')[0]
      if (icon.toLowerCase().endsWith('.exe')) {
        // It is also executable path
        if (fs.existsSync(path.join(icon, '../resources/electron.asar'))) {
          apps.push({
            id: icon,
            name: app.DisplayName ? app.DisplayName.value : '',
            icon: '',
            exePath: icon,
          })
        } else {
          continue
        }
      } else if (icon.toLowerCase().endsWith('.ico')) {
        iconPath = icon
        installPath = path.dirname(icon)
      }
    } else if (app.InstallLocation) {
      installPath = app.InstallLocation.value
    }

    if (!installPath) continue

    try {
      const files = await fs.promises.readdir(installPath)
      if (fs.existsSync(path.join(installPath, 'resources/electron.asar'))) {
        const [exeFile] = files.filter(file => {
          return (
            file.endsWith('.exe') &&
            !['uninstall', 'update'].some(keyword =>
              file.toLowerCase().includes(keyword),
            )
          )
        })
        if (exeFile) {
          apps.push({
            id: path.resolve(installPath, exeFile),
            name: app.DisplayName ? app.DisplayName.value : '',
            icon: '',
            exePath: path.resolve(installPath, exeFile),
          })
        } else {
          continue
        }
      }
    } catch (err) {
      console.error(err)
    }

    // const semverDir = files.find(file => /\d+\.\d+\.\d+/.test(file))

    // const isElectronBased =
    //   semverDir &&
    //   fs.existsSync(
    //     path.join(installPath, semverDir, 'resources/electron.asar'),
    //   )
  }

  return apps
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
        appPath: '',
        exePath: p,
      }
    case 'darwin':
      return getAppInfo(p)
    default:
      return
  }
}

export async function getAppInfo(
  appPath: string,
): Promise<AppInfo | undefined> {
  switch (process.platform) {
    case 'win32': {
      try {
        const files = await fs.promises.readdir(appPath)

        const isElectronBased =
          fs.existsSync(path.join(appPath, 'resources/electron.asar')) ||
          files.some(dir => {
            return fs.existsSync(
              path.join(appPath, dir, 'resources/electron.asar'),
            )
          })

        if (!isElectronBased) return

        // TODO: The first one
        const [exeFile] = files.filter(file => {
          return (
            file.endsWith('.exe') &&
            !['uninstall', 'update'].some(keyword =>
              file.toLowerCase().includes(keyword),
            )
          )
        })
        if (!exeFile) return

        let icon = ''
        if (fs.existsSync(path.resolve(appPath, 'app.ico'))) {
          const iconBuffer = await fs.promises.readFile(
            path.resolve(appPath, 'app.ico'),
          )
          icon = 'data:image/x-icon;base64,' + iconBuffer.toString('base64')
        }

        return {
          id: v4(), // TODO: get app id from register
          name: path.basename(exeFile, '.exe'),
          icon,
          appPath,
          exePath: path.resolve(appPath, exeFile),
        }
      } catch (err) {
        // catch errors of readdir
        // 1. file: ENOTDIR: not a directory
        // 2. no permission at windows: EPERM: operation not permitted
        // console.error(err.message)
        return
      }
    }
    case 'darwin': {
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
        appPath,
        exePath: path.resolve(
          appPath,
          'Contents/MacOS',
          info.CFBundleExecutable,
        ),
      }
    }
    default:
      throw new Error('platform not supported: ' + process.platform)
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

// Detect Electron apps
export async function getElectronApps() {
  let apps: AppInfo[] = []
  switch (process.platform) {
    case 'win32': {
      const params = [
        ['HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '64'],
        ['HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '32'],
        ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '64'],
      ]
      const items = await Promise.all(
        params.map(param => readWindowsApps(param[0], param[1])),
      )
      apps = items.flat()
      break
    }
    case 'darwin': {
      const appPaths = await readdirAbsolute('/Applications')
      apps = [] as AppInfo[]
      for (let p of appPaths) {
        // TODO: parallel
        // console.log(p)
        const info = await getAppInfo(p)
        if (info) {
          // console.log(info.name)
          apps.push(info)
        }
      }
      break
    }
  }

  return apps.reduce(
    (a, b) => {
      a[b.id] = b
      return a
    },
    {} as Dict<AppInfo>,
  )
}
