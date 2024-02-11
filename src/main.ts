import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  MenuItem,
  shell,
  nativeImage,
} from "electron";
import path from "path";
import { spawn } from "child_process";
import { Adapter } from "./main/adapter";
import { WinAdapter } from "./main/win";
import { MacosAdapter } from "./main/macos";
import { LinuxAdapter } from "./main/linux";
import { setUpdater, setReporter } from "./main/utils";
import { AppInfo } from "./renderer/app-context";
import { SessionDispatch } from "./renderer/session-context";
import getPort from "get-port";
import { v4 } from "uuid";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
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
  // send action to renderer
  // const appDispatch: AppDispatch = (action) => {
  //   mainWindow?.webContents.send("app-dispatch", action);
  // };
  const sessionDispatch: SessionDispatch = (action) => {
    mainWindow?.webContents.send("session-dispatch", action);
  };

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  let adapter: Adapter;
  switch (process.platform) {
    case "win32":
      adapter = new WinAdapter();
      break;
    case "darwin":
      adapter = new MacosAdapter();
      break;
    case "linux":
      adapter = new LinuxAdapter();
      break;
    default:
      throw new Error("platform not supported");
  }

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

  ipcMain.on("debug", async (e, app: AppInfo) => {
    const nodePort = await getPort();
    const windowPort = await getPort();

    const sp = spawn(
      app.exePath,
      [`--inspect=${nodePort}`, `--remote-debugging-port=${windowPort}`],
      {
        cwd: process.platform === "win32" ? path.dirname(app.exePath) : "/",
      },
    );

    const sessionId = v4();
    sessionDispatch({
      type: "add",
      sessionId,
      appId: app.id,
      nodePort,
      windowPort,
    });

    sp.on("error", (err) => {
      dialog.showErrorBox(`Error: ${app.name}`, err.message);
    });
    sp.on("close", () => {
      // console.log(`child process exited with code ${code}`)
      sessionDispatch({ type: "remove", sessionId });
      // TODO: Remove temp app
    });

    const handleStdout =
      (isError = false) =>
      (chunk: Buffer) => {
        // TODO: stderr colors
        console.log(isError);
        sessionDispatch({ type: "log", sessionId, text: chunk.toString() });
      };

    if (sp.stdout) {
      sp.stdout.on("data", handleStdout());
    }
    if (sp.stderr) {
      sp.stderr.on("data", handleStdout(true));
    }
  });
  ipcMain.handle("read-apps", () => {
    return adapter
      .readApps()
      .then((apps) => apps.filter((a) => typeof a !== "undefined"));
  });
  ipcMain.handle("read-app-by-path", (e, p) => {
    return adapter.readAppByPath(p);
  });
  ipcMain.on("open-window", (e, url: string) => {
    const win = new BrowserWindow();
    // console.log(url)
    win.loadURL(url);
  });
}
