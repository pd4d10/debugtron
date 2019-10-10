import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { forwardToRenderer, replayActionMain } from 'electron-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import { reducer, GET_APPS, UPDATE_INSTANCE } from '../reducer'
import { getElectronApps, startDebugging, getAppInfo } from './utils'
import { setUpdater } from './updater'
import { AppInfo, PageInfo, Dict } from '../types'
import fetch from 'node-fetch'

const store = createStore(reducer, applyMiddleware(thunk, forwardToRenderer))
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
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const fetchPages = async () => {
  const { instanceInfo } = store.getState()
  for (let [id, instance] of Object.entries(instanceInfo)) {
    const ports: string[] = []
    if (instance.nodePort) ports.push(instance.nodePort)
    if (instance.windowPort) ports.push(instance.windowPort)

    const payloads = await Promise.all(
      ports.map(port =>
        fetch(`http://127.0.0.1:${port}/json`).then(res => res.json()),
      ),
    )

    const pages = payloads.flat() as PageInfo[]
    if (pages.length === 0) return

    const pageDict = pages.reduce(
      (a, b) => {
        a[b.id] = b
        return a
      },
      {} as Dict<PageInfo>,
    )

    store.dispatch({
      type: UPDATE_INSTANCE,
      payload: { instanceId: id, pages: pageDict },
    })
  }
}

app.on('ready', async () => {
  if (process.env.NODE_ENV !== 'production') {
    const installer = require('electron-devtools-installer')
    await Promise.all(
      ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'].map(name =>
        installer.default(installer[name]),
      ),
    )
  }

  setUpdater()
  createWindow()
  setInterval(fetchPages, 3000)

  const apps = await getElectronApps()
  store.dispatch({ type: GET_APPS, payload: apps })
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
  'startDebugging',
  async (e: Electron.Event, payload: { id?: string; path?: string }) => {
    try {
      let app: AppInfo
      if (payload.id) {
        app = store.getState().appInfo[payload.id]
      } else if (payload.path) {
        app = await getAppInfo(payload.path)
      } else {
        throw new Error()
      }

      startDebugging(app, store)
    } catch (err) {
      dialog.showErrorBox('Error', err.message)
    }
  },
)
