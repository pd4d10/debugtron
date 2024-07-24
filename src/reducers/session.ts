import type { AppInfo, PageInfo, SessionInfo } from "../reducer";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type SessionState = Record<string, SessionInfo>;

const initialState: SessionState = {};

export const sessionSlice = createSlice({
  name: "session",
  initialState,
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
        state[sessionId]!.page = {};

        payload[i]!.sort((a, b) => (a.id < b.id ? -1 : 1)).forEach((p) => {
          state[sessionId]!.page[p.id] = p;
        });
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
      delete state[sessionId];
    },
  },
});
