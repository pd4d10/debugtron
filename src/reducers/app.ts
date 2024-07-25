import type { AppInfo } from "../reducer";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type AppState = Record<string, AppInfo>;

const initialState: AppState = {};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    found: (state, { payload }: PayloadAction<AppInfo[]>) => {
      Object.keys(state).forEach((key) => {
        delete state[key];
      });
      payload
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .forEach((appInfo) => {
          state[appInfo.id] = appInfo;
        });
    },
  },
});
