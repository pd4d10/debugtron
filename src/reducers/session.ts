import { appSlice, type AppInfo } from "./app";
import { asyncThunkCreator, buildCreateSlice } from "@reduxjs/toolkit";

type SessionId = string;
type PageId = string;
export type PageInfo = {
  description: string;
  devtoolsFrontendUrl: string;
  id: PageId;
  title: string;
  type: "node" | "page" | "webview";
  url: string;
};
type SessionInfo = {
  appId: string;
  pages: Record<string, PageInfo>;
  log: string;
  nodePort: number;
  windowPort: number;
};
type State = Record<SessionId, SessionInfo>;

const initialState: State = {};

export const sessionSlice = buildCreateSlice({
  creators: { asyncThunk: asyncThunkCreator },
})({
  name: "session",
  initialState,
  reducers: (create) => ({
    add: create.reducer<{
      sessionId: SessionId;
      appId: string;
      nodePort: number;
      windowPort: number;
    }>((state, { payload }) => {
      state[payload.sessionId] = {
        appId: payload.appId,
        nodePort: payload.nodePort,
        windowPort: payload.windowPort,
        pages: {},
        log: "",
      };
    }),
    remove: create.reducer<SessionId>((state, { payload }) => {
      delete state[payload];
    }),
    updatePages: create.asyncThunk<
      { sessionId: string; pages: PageInfo[] },
      { ports: number[]; sessionId: string }
    >(
      async ({ ports, sessionId }) => {
        if (IN_MAIN_PROCESS) {
          const payloads = await Promise.allSettled<PageInfo>(
            ports.map((port) =>
              fetch(`http://127.0.0.1:${port}/json`).then((res) => res.json()),
            ),
          );
          const pages = payloads.flatMap((p) =>
            p.status === "fulfilled" ? p.value : [],
          );
          console.log(ports, pages);
          return { sessionId, pages };
        } else {
          return { sessionId: "", pages: [] };
        }
      },
      {
        fulfilled: (state, { payload: { sessionId, pages } }) => {
          state[sessionId]!.pages = {};
          pages
            .sort((a, b) => (a.id < b.id ? -1 : 1))
            .forEach((page) => {
              state[sessionId]!.pages[page.id] = page;
            });
        },
      },
    ),
    updateLog: create.reducer<{ sessionId: string; text: string }>(
      (state, { payload }) => {
        state[payload.sessionId]!.log += payload.text;
      },
    ),
    debug: create.asyncThunk<void, AppInfo>(async (app, { dispatch }) => {
      if (IN_MAIN_PROCESS) {
        const { spawn } = await import("child_process");
        const { dialog } = await import("electron");
        const { default: getPort } = await import("get-port");
        const path = await import("path");
        const { v4 } = await import("uuid");

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
        dispatch(
          sessionSlice.actions.add({
            sessionId,
            appId: app.id,
            nodePort,
            windowPort,
          }),
        );

        sp.on("error", (err) => {
          dialog.showErrorBox(`Error: ${app.name}`, err.message);
        });
        sp.on("close", () => {
          // console.log(`child process exited with code ${code}`)
          dispatch(sessionSlice.actions.remove(sessionId));
          // TODO: Remove temp app
        });

        const handleStdout =
          (isError = false) =>
          (chunk: Buffer) => {
            // TODO: stderr colors
            console.log(isError);
            dispatch(
              sessionSlice.actions.updateLog({
                sessionId,
                text: chunk.toString(),
              }),
            );
          };

        if (sp.stdout) {
          sp.stdout.on("data", handleStdout());
        }
        if (sp.stderr) {
          sp.stderr.on("data", handleStdout(true));
        }
      }
    }),
    debugPath: create.asyncThunk<void, string>(async (p, { dispatch }) => {
      if (IN_MAIN_PROCESS) {
        const { getAdapter } = await import("../main/adapter");

        const current = await getAdapter().readAppByPath(p);
        if (current) {
          dispatch(appSlice.actions.addTemp(current)); // TODO: Remove it after session closed
          dispatch(sessionSlice.actions.debug(current));
        } else {
          alert(
            "Invalid application path: " +
              `${p} is not an Electron-based application`,
          );
        }
      }
    }),
    openWindow: create.asyncThunk<void, string>(async (url) => {
      if (IN_MAIN_PROCESS) {
        const { BrowserWindow } = await import("electron");
        const win = new BrowserWindow();
        // console.log(url)
        win.loadURL(url);
      }
    }),
  }),
});
