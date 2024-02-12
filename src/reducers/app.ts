import { asyncThunkCreator, buildCreateSlice } from "@reduxjs/toolkit";

type AppId = string;
export type AppInfo = {
  id: AppId;
  name: string;
  icon: string;
  exePath: string;
  hidden?: boolean;
};
type State = {
  status: "idle" | "loading" | "failed";
  info: Record<AppId, AppInfo>;
};

const initialState: State = {
  status: "idle",
  info: {},
};

export const appSlice = buildCreateSlice({
  creators: { asyncThunk: asyncThunkCreator },
})({
  name: "app",
  initialState,
  reducers: (create) => ({
    read: create.asyncThunk(
      async () => {
        const { ipcRenderer } = require("electron");
        const apps: AppInfo[] = await ipcRenderer.invoke("read-apps");
        return apps;
      },
      {
        pending: (state) => {
          state.status = "loading";
        },
        fulfilled: (state, action) => {
          state.status = "idle";
          state.info = action.payload
            .sort((a, b) => (a.id < b.id ? -1 : 1))
            .reduce((s, app) => {
              return {
                ...s,
                [app.id]: app,
              };
            }, state.info);
        },
        rejected: (state) => {
          state.status = "failed";
        },
      },
    ),
    addTemp: create.reducer<AppInfo>((state, { payload }) => {
      if (payload) {
        state.info[payload.id] = payload; // TODO: Remove it after session closed
        state.info[payload.id]!.hidden = true;
      }
    }),
  }),
});
