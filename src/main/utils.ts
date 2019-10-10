import fs from 'fs'
import os from 'os'
import path from 'path'
import plist from 'plist'
import { v4 } from 'uuid'
import { spawn } from 'child_process'
import fetch from 'node-fetch'
import { PageInfo, AppInfo, Dict } from '../types'
import { Store } from 'redux'
import {
  ADD_INSTANCE,
  UPDATE_LOG,
  UPDATE_INSTANCE,
  REMOVE_INSTANCE,
} from '../reducer'

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

async function getPossibleAppPaths() {
  switch (process.platform) {
    case 'win32': {
      const apps = await Promise.all(
        [
          os.homedir() + '/AppData/Local',
          'c:/Program Files',
          'c:/Program Files (x86)',
        ].map(dir => readdirAbsolute(dir)),
      )
      return apps.flat()
    }
    case 'darwin':
      return readdirAbsolute('/Applications')
    default:
      return []
  }
}

async function isElectronApp(appPath: string) {
  switch (process.platform) {
    case 'win32': {
      try {
        const dirs = await fs.promises.readdir(appPath)
        const [dir] = dirs.filter(name => name.startsWith('app-'))
        return (
          dir &&
          fs.existsSync(path.join(appPath, dir, 'resources/electron.asar'))
        )
      } catch (err) {
        // catch errors of readdir
        // 1. file: ENOTDIR: not a directory
        // 2. no permission at windows: EPERM: operation not permitted
        // console.error(err.message)
        return false
      }
    }
    case 'darwin':
      return fs.existsSync(
        path.join(appPath, 'Contents/Frameworks/Electron Framework.framework'),
      )
    default:
      return false
  }
}

async function getAppInfo(appPath: string): Promise<AppInfo> {
  switch (process.platform) {
    case 'win32':
      const files = await fs.promises.readdir(appPath)
      const exeFiles = files.filter(
        file => file.endsWith('.exe') && !file.startsWith('Uninstall'),
      )
      return {
        id: v4(), // TODO: get app id from register
        name: path.basename(appPath),
        icon: '',
        appPath,
        exePath: exeFiles[0],
      }
    case 'darwin':
      const infoContent = await fs.promises.readFile(
        path.join(appPath, 'Contents/Info.plist'),
        { encoding: 'utf8' },
      )
      const info = plist.parse(infoContent) as {
        CFBundleIdentifier: string
        CFBundleDisplayName: string
        CFBundleExecutable: string
        CFBundleIconFile: string
      }

      const icon = await readIcnsAsImageUri(
        path.join(appPath, 'Contents', 'Resources', info.CFBundleIconFile),
      )

      return {
        id: info.CFBundleIdentifier,
        name: info.CFBundleDisplayName,
        icon,
        appPath,
        exePath: path.resolve(
          appPath,
          'Contents',
          'MacOS',
          info.CFBundleExecutable,
        ),
      }
    default:
      throw new Error('platform not supported: ' + process.platform)
  }
}

async function getExecutable(appPath: string) {
  switch (process.platform) {
    case 'win32': {
      const appName = path.basename(appPath)
      return path.join(appPath, appName + '.exe')
    }
    case 'darwin': {
      const exesDir = path.join(appPath, 'Contents/MacOS')
      const [exe] = await fs.promises.readdir(exesDir)
      return path.join(exesDir, exe)
    }
    default:
      throw new Error('platform not supported: ' + process.platform)
  }
}

export async function startDebugging(
  payload: { id?: string; path?: string },
  store: Store,
) {
  let app: AppInfo
  if (payload.id) {
    app = store.getState().appInfo[payload.id]
  } else if (payload.path) {
    app = await getAppInfo(payload.path)
  } else {
    throw new Error()
  }

  const { appPath } = app

  const executable =
    path.extname(appPath) === '.exe' ? appPath : await getExecutable(appPath)
  const sp = spawn(executable, [`--inspect=0`, `--remote-debugging-port=0`])

  let ready = false
  const instanceId = v4()

  store.dispatch({
    type: ADD_INSTANCE,
    payload: { appId: app.id, instanceId },
  })

  let nodePort: string
  let windowPort: string

  sp.stdout.on('data', chunk => {
    store.dispatch({
      type: UPDATE_LOG,
      payload: { instanceId, log: chunk.toString() },
    })
  })

  sp.stderr.on('data', async chunk => {
    const data = chunk.toString()

    // Try to find listening port from log
    if (!nodePort) {
      const match = /Debugger listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      console.log(match, data)
      if (match) {
        nodePort = match[1]
      }
    }
    if (!windowPort) {
      const match = /DevTools listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      console.log(match, data)
      if (match) {
        windowPort = match[1]
      }
    }

    // Ensure debugger port is already listening
    if (!ready && nodePort && windowPort) {
      ready = true

      setTimeout(async () => {
        const payloads = await Promise.all(
          [nodePort, windowPort].map(port =>
            fetch(`http://127.0.0.1:${port}/json`).then(res => res.json()),
          ),
        )
        const pages = (payloads.flat() as PageInfo[]).reduce(
          (a, b) => {
            a[b.id] = b
            return a
          },
          {} as Dict<PageInfo>,
        )

        store.dispatch({
          type: UPDATE_INSTANCE,
          payload: { instanceId, pages },
        })
      }, 2000)
    }

    // TODO: stderr colors
    store.dispatch({
      type: UPDATE_LOG,
      payload: { instanceId, log: data },
    })
  })

  sp.on('close', code => {
    console.log(`child process exited with code ${code}`)
    store.dispatch({
      type: REMOVE_INSTANCE,
      payload: { instanceId },
    })
  })
}

// Detect Electron apps
export async function getElectronApps() {
  const appPaths = await getPossibleAppPaths()
  const infos = [] as AppInfo[]
  for (let p of appPaths) {
    // TODO: parallel
    if (await isElectronApp(p)) {
      console.log(p)
      const info = await getAppInfo(p)
      console.log(info.name)
      infos.push(info)
    }
  }

  return infos.reduce(
    (a, b) => {
      a[b.id] = b
      return a
    },
    {} as Dict<AppInfo>,
  )
}
