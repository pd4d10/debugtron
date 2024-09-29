import { app, BrowserWindow, ipcMain, Menu, MenuItem, nativeImage, shell } from "electron";
import path from "path";
import type { AppInfo } from "../reducers/app";
import { debug, debugPath, init } from "./actions";
import { store } from "./store";
import { setReporter, setUpdater } from "./utils";
import DebugronIcon from "../../assets/icon.png";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 14 },
    icon: process.platform === "linux"
      ? nativeImage.createFromDataURL(DebugronIcon)
      : undefined,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // for `require`
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  store.dispatch(
    // @ts-ignore
    init(),
  );

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("ready", async () => {
    if (app.isPackaged) {
      setReporter();
    } else {
      const devtools = await import("electron-devtools-installer");
      devtools.default(devtools.REACT_DEVELOPER_TOOLS);
      devtools.default(devtools.REDUX_DEVTOOLS);
    }

    const defaultMenu = Menu.getApplicationMenu();
    if (defaultMenu) {
      defaultMenu.append(
        new MenuItem({
          label: "About",
          submenu: [
            {
              label: "Source Code",
              click() {
                shell.openExternal("https://github.com/pd4d10/debugtron");
              },
            },
            {
              label: "Submit an Issue",
              click() {
                shell.openExternal(
                  "https://github.com/pd4d10/debugtron/issues/new",
                );
              },
            },
          ],
        }),
      );
    }

    ipcMain.on("debug", (e, appInfo: AppInfo) => {
      store.dispatch(
        // @ts-ignore
        debug(appInfo),
      );
    });
    ipcMain.on("debug-path", (e, path: string) => {
      store.dispatch(
        // @ts-ignore
        debugPath(path),
      );
    });
    ipcMain.on("open-window", (e, url: string) => {
      const win = new BrowserWindow();
      // console.log(url)
      win.loadURL(url);
    });

    setUpdater();
    createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
