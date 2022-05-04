import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  MenuItem,
  shell,
  nativeImage,
} from 'electron'
import { composeWithStateSync } from 'electron-redux/main'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import { addTempApp } from '../reducers/app'
import reducers, { State } from '../reducers'
import { Adapter } from './adapter'
import { WinAdapter } from './win'
import { MacosAdapter } from './macos'
import { startDebugging, fetchPages, detectApps } from './actions'
import { LinuxAdapter } from './linux'
import { setUpdater, setReporter } from './utils'

const store = createStore<State, any, {}, {}>(
  reducers,
  composeWithStateSync(applyMiddleware(thunk))
)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null

console.log(MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY)

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon:
      process.platform === 'linux'
        ? nativeImage.createFromDataURL(require('../../assets/icon.png'))
        : undefined,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // for `require`
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  })

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

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
    case 'linux':
      adapter = new LinuxAdapter()
      break
    default:
      throw new Error('platform not supported')
  }

  app.on('ready', async () => {
    if (app.isPackaged) {
      setReporter()
    } else {
      // TODO: electron 9
      // const installer = require('electron-devtools-installer')
      // await Promise.all(
      //   ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'].map((name) =>
      //     installer.default(installer[name])
      //   )
      // )
      // require('devtron').install()
    }

    const defaultMenu = Menu.getApplicationMenu()
    if (defaultMenu) {
      defaultMenu.append(
        new MenuItem({
          label: 'About',
          submenu: [
            {
              label: 'Source Code',
              click() {
                shell.openExternal('https://github.com/bytedance/debugtron')
              },
            },
            {
              label: 'Submit an Issue',
              click() {
                shell.openExternal(
                  'https://github.com/bytedance/debugtron/issues/new'
                )
              },
            },
          ],
        })
      )
    }

    setUpdater()
    createWindow()
    store.dispatch(detectApps(adapter))
    setInterval(() => {
      store.dispatch(fetchPages())
    }, 3000)
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
      const duplicated = Object.values(appInfo).find((a) => a.exePath === p)
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
          `${p} is not an Electron-based application`
        )
      }
    }
  )

  ipcMain.on('startDebugging', async (e: Electron.Event, id: string) => {
    const { appInfo } = store.getState()
    store.dispatch(startDebugging(appInfo[id]))
  })

  ipcMain.on('detectApps', async () => {
    store.dispatch(detectApps(adapter))
  })

  ipcMain.on('openWindow', (e: Electron.Event, url: string) => {
    const win = new BrowserWindow()
    // console.log(url)
    win.loadURL(url)
  })
}
