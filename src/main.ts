import { setUpdater, setReporter } from "./main/utils";
import { reducers } from "./reducers";
import { appSlice } from "./reducers/app";
import { configureStore } from "@reduxjs/toolkit";
import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  shell,
  nativeImage,
} from "electron";
import { stateSyncEnhancer } from "electron-redux/main";
import path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 14 },
    icon:
      process.platform === "linux"
        ? nativeImage.createFromDataURL(require("../../assets/icon.png"))
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
  const store = configureStore({
    reducer: reducers,
    enhancers: (getDefault) => getDefault().concat(stateSyncEnhancer()),
  });
  store.dispatch(appSlice.actions.read(null));

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
      // TODO: electron 9
      const installer = require("electron-devtools-installer");
      await Promise.all(
        ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"].map((name) =>
          installer.default(installer[name]),
        ),
      );
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

    // ipcMain.on("dispatch-from-renderer", () => {

    // })

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
