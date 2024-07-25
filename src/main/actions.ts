import type { ThunkDispatch } from "@reduxjs/toolkit";
import { spawn } from "child_process";
import { dialog } from "electron";
import getPort from "get-port";
import { chunk } from "lodash-es";
import path from "node:path";
import { v4 } from "uuid";
import { type AppInfo, appSlice } from "../reducers/app";
import { type PageInfo, sessionSlice } from "../reducers/session";
import { importByPlatform } from "./platforms";
import type { State } from "./store";

type ThunkActionCreator<P1 = void, P2 = void> = (
  p1: P1,
  p2: P2,
) => (
  dispatch: ThunkDispatch<State, never, any>,
  getState: () => State,
) => void;

export const init: ThunkActionCreator = () => async (dispatch, getState) => {
  // first load
  const { adapter } = await importByPlatform();
  const apps = await adapter.readAll();

  if (!apps.ok) throw new Error("Failed to read apps");
  dispatch(appSlice.actions.found(apps.unwrap()));

  // timer
  setInterval(async () => {
    const { session } = getState();
    const sessions = Object.values(session);
    const ports = sessions.flatMap((s) => [s.nodePort, s.windowPort]);

    const responses = await Promise.allSettled<PageInfo[]>(
      ports.map((port) => fetch(`http://127.0.0.1:${port}/json`).then((res) => res.json())),
    );
    const pagess = chunk(
      responses.map((p) => (p.status === "fulfilled" ? p.value : [])),
      2,
    ).map((item) => item.flat());
    console.log(ports, pagess);

    dispatch(sessionSlice.actions.pageUpdated(pagess));
  }, 3000);
};

export const debug: ThunkActionCreator<AppInfo> = (app) => async (dispatch) => {
  const nodePort = await getPort();
  const windowPort = await getPort();

  const sp = spawn(
    app.exePath,
    [
      `--inspect=${nodePort}`,
      `--remote-debugging-port=${windowPort}`,
      "--remote-allow-origins=devtools://devtools",
    ],
    {
      cwd: process.platform === "win32" ? path.dirname(app.exePath) : "/",
    },
  );

  const sessionId = v4();
  dispatch(
    sessionSlice.actions.added({
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
    dispatch(sessionSlice.actions.removed(sessionId));
  });

  const handleStdout = (isError = false) => (chunk: Buffer) => {
    // TODO: stderr colors
    dispatch(
      sessionSlice.actions.logAppended({
        sessionId,
        content: chunk.toString(),
      }),
    );
  };

  if (sp.stdout) {
    sp.stdout.on("data", handleStdout());
  }
  if (sp.stderr) {
    sp.stderr.on("data", handleStdout(true));
  }
};

export const debugPath: ThunkActionCreator<string> = (path) => async (dispatch) => {
  // TODO:
};
