import fs from 'fs'
import os from 'os'
import path from 'path'
import plist from 'plist'
import { v4 } from 'uuid'
import { app, BrowserWindow, ipcMain } from 'electron'
import { spawn } from 'child_process'
import fetch from 'node-fetch'
import { PageInfo, EventName, AppInfo, Dict } from '../types'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit()
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// read absolute directories
function readdirAbsolute(dir: string) {
  try {
    return fs.readdirSync(dir).map(file => path.join(dir, file))
  } catch (err) {
    return []
  }
}

function getPossibleAppPaths() {
  switch (process.platform) {
    case 'win32': {
      const apps = [
        ...readdirAbsolute(os.homedir() + '/AppData/Local'),
        ...readdirAbsolute('c:/Program Files'),
        ...readdirAbsolute('c:/Program Files (x86)'),
      ]
      return apps
    }
    case 'darwin':
      return readdirAbsolute('/Applications')
    default:
      return []
  }
}

function isElectronApp(appPath: string) {
  switch (process.platform) {
    case 'win32': {
      try {
        const [dir] = fs
          .readdirSync(appPath)
          .filter(name => name.startsWith('app-'))
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
  }
}

async function getAppInfo(appPath: string): Promise<AppInfo> {
  switch (process.platform) {
    case 'win32':
      throw new Error('')
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

      return {
        id: info.CFBundleIdentifier,
        name: info.CFBundleDisplayName,
        icon: info.CFBundleIconFile,
        appPath: appPath,
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

function getExecutable(appPath: string) {
  switch (process.platform) {
    case 'win32': {
      const appName = path.basename(appPath)
      return path.join(appPath, appName + '.exe')
    }
    case 'darwin': {
      const exesDir = path.join(appPath, 'Contents/MacOS')
      const [exe] = fs.readdirSync(exesDir)
      return path.join(exesDir, exe)
    }
    default:
      throw new Error('platform not supported: ' + process.platform)
  }
}

function startDebugging(app: AppInfo) {
  const { appPath } = app
  const nodePort = 10000
  const windowPort = 10001

  const executable =
    path.extname(appPath) === '.exe' ? appPath : getExecutable(appPath)
  const sp = spawn(executable, [
    `--inspect=${nodePort}`,
    `--remote-debugging-port=${windowPort}`,
  ])

  let fetched = false
  let instanceId = v4()
  mainWindow!.webContents.send(EventName.appPrepare, instanceId, app.id)

  sp.stdout.on('data', data => {
    mainWindow!.webContents.send(EventName.log, instanceId, data)
  })

  sp.stderr.on('data', async data => {
    // waiting for stderr output to ensure debugger port is already listening
    if (!fetched) {
      fetched = true

      // Window port is not ready, use a timeout
      setTimeout(async () => {
        const [json0, json1] = (await Promise.all(
          [nodePort, windowPort].map(port =>
            fetch(`http://127.0.0.1:${port}/json`).then(res => res.json()),
          ),
        )) as [PageInfo[], PageInfo[]]

        if (!mainWindow) throw new Error('main window already destroyed')
        mainWindow.webContents.send(EventName.appStarted, instanceId, [
          ...json0,
          ...json1,
        ])
      }, 500)
    }

    mainWindow!.webContents.send(EventName.log, instanceId, data)
  })

  sp.on('close', code => {
    console.log(`child process exited with code ${code}`)
    // mainWindow.webContents.send(EventChannel.appStarted, [])
  })
}

ipcMain.on(EventName.getApps, async (e: Electron.Event) => {
  const appPaths = getPossibleAppPaths().filter(isElectronApp)
  const infos = await Promise.all(appPaths.map(getAppInfo))
  e.returnValue = infos.reduce(
    (a, b) => {
      a[b.id] = b
      return a
    },
    {} as Dict<AppInfo>,
  )
})

ipcMain.on(EventName.startDebugging, (e: Electron.Event, appInfo: AppInfo) => {
  startDebugging(appInfo)
})
