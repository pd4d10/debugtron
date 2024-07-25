import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type AppInfo = {
  id: string;
  name: string;
  icon: string;
  exePath: string;
};

export const appSlice = createSlice({
  name: "app",
  initialState: {} as Record<string, AppInfo>,
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
