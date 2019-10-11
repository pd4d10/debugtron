import { app, BrowserWindow, ipcMain } from 'electron'
import { forwardToRenderer, replayActionMain } from 'electron-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import { updatePages } from '../reducers/instance'
import { getElectronApps, startDebugging, getAppInfoByDnd } from './utils'
import { setUpdater, pkg } from './updater'
import { PageInfo, Dict } from '../types'
import { machineId } from 'node-machine-id'
import ua from 'universal-analytics'
import fetch from 'node-fetch'
import { getApps, addTempApp } from '../reducers/app'
import reducers from '../reducers'

const store = createStore(reducers, applyMiddleware(thunk, forwardToRenderer))
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

    store.dispatch(updatePages(id, pageDict))
  }
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

    try {
      const id = await machineId()
      const client = ua('UA-145047249-4', id, { strictCidFormat: false })
      client.pageview({ dp: '/' + pkg.version }).send()
    } catch (err) {
      console.error(err)
    }

    setUpdater()
    createWindow()
    setInterval(fetchPages, 3000)

    const apps = await getElectronApps()
    store.dispatch(getApps(apps))
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
      const { appInfo } = store.getState()
      if (payload.id) {
        const current = appInfo[payload.id]

        if (current) {
          startDebugging(current, store)
        }
      } else if (payload.path) {
        const current = await getAppInfoByDnd(payload.path)

        if (current) {
          const { exePath } = current
          const duplicated = Object.values(appInfo).find(
            a => a.exePath === exePath,
          )
          if (duplicated) {
            startDebugging(duplicated, store)
          } else {
            store.dispatch(addTempApp(current))
            startDebugging(current, store)
          }
        }
      }
    },
  )
}
