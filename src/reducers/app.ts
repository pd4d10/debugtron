import { createSlice,
  type PayloadAction,

} from "@reduxjs/toolkit";

export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  exePath: string;
}

export const appSlice = createSlice({
  name: "app",
  initialState: {} as Record<string, AppInfo>,
  reducers: {
    found: (state, { payload }: PayloadAction<AppInfo[]>) => {
      // Clear existing state
      Object.keys(state).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
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
