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
    updatePages: create.asyncThunk(
      async ({ ports, sessionId }: { ports: number[]; sessionId: string }) => {
        const { ipcRenderer } = require("electron");
        const pages: PageInfo[] = await ipcRenderer.invoke(
          "fetch-pages",
          ports,
        );
        return { sessionId, pages };
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
  }),
});
