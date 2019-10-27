import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { forwardToRenderer, replayActionMain } from 'electron-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import { setUpdater } from './updater'
import { Dict, AppInfo } from '../types'
import { getApps, addTempApp, getAppStart } from '../reducers/app'
import reducers, { State } from '../reducers'
import { Adapter } from './adapter'
import { WinAdapter } from './win'
import { MacosAdapter } from './macos'
import { startDebugging, fetchPages } from './actions'

const store = createStore<State, any, {}, {}>(
  reducers,
  applyMiddleware(thunk, forwardToRenderer),
)
replayActionMain(store)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  let adapter: Adapter
  switch (process.platform) {
    case 'win32':
      adapter = new WinAdapter()
      break
    case 'darwin':
      adapter = new MacosAdapter()
      break
    default:
      throw new Error('platform not supported')
  }

  app.on('ready', async () => {
    // TODO: Uncomment after https://github.com/MarshallOfSound/electron-devtools-installer/pull/92 merged
    // if (!app.isPackaged) {
    //   const installer = require('electron-devtools-installer')
    //   await Promise.all(
    //     ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'].map(name =>
    //       installer.default(installer[name]),
    //     ),
    //   )
    // }

    setUpdater()
    createWindow()
    setInterval(() => {
      store.dispatch(fetchPages())
    }, 3000)

    store.dispatch(getAppStart())
    const apps = await adapter.readApps()
    const appInfo = apps.reduce(
      (a, b) => {
        if (b) {
          a[b.id] = b
        }
        return a
      },
      {} as Dict<AppInfo>,
    )
    store.dispatch(getApps(appInfo))
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })

  ipcMain.on(
    'startDebuggingWithExePath',
    async (e: Electron.Event, p: string) => {
      const { appInfo } = store.getState()
      const duplicated = Object.values(appInfo).find(a => a.exePath === p)
      if (duplicated) {
        store.dispatch(startDebugging(duplicated))
        return
      }

      const current = await adapter.readAppByPath(p)
      if (current) {
        store.dispatch(addTempApp(current)) // TODO: Remove it after session closed
        store.dispatch(startDebugging(current))
      } else {
        dialog.showErrorBox(
          'Invalid application path',
          `${p} is not a valid application`,
        )
      }
    },
  )

  ipcMain.on('startDebugging', async (e: Electron.Event, id: string) => {
    const { appInfo } = store.getState()
    store.dispatch(startDebugging(appInfo[id]))
  })
}
