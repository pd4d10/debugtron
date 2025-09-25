import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PageInfo {
  description: string;
  devtoolsFrontendUrl: string;
  id: string;
  title: string;
  type: "node" | "page" | "webview";
  url: string;
}

export interface SessionInfo {
  appId: string;
  page: Record<string, PageInfo>;
  log: string;
  nodePort: number;
  windowPort: number;
}

export const sessionSlice = createSlice({
  name: "session",
  initialState: {} as Record<string, SessionInfo>,
  reducers: {
    added: (
      state,
      {
        payload: { sessionId, ...rest },
      }: PayloadAction<{
        sessionId: string;
        appId: string;
        nodePort: number;
        windowPort: number;
      }>,
    ) => {
      state[sessionId] = { ...rest, page: {}, log: "" };
    },
    pageUpdated: (state, { payload }: PayloadAction<PageInfo[][]>) => {
      Object.keys(state).forEach((sessionId, i) => {
        const session = state[sessionId];
        const pages = payload[i];
        if (session && pages) {
          session.page = {};
          pages.sort((a, b) => (a.id < b.id ? -1 : 1)).forEach((p) => {
            session.page[p.id] = p;
          });
        }
      });
    },
    logAppended: (
      state,
      {
        payload: { sessionId, content },
      }: PayloadAction<{ sessionId: string; content: string }>,
    ) => {
      const selected = state[sessionId];
      if (selected) selected.log += content;
    },
    removed: (state, { payload: sessionId }: PayloadAction<string>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[sessionId];
    },
  },
});
