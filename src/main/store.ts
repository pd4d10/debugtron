import { appSlice } from "../reducers/app";
import { sessionSlice } from "../reducers/session";
import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/main";

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    session: sessionSlice.reducer,
  },
  enhancers: (g) => g().concat(stateSyncEnhancer()),
});

export type State = ReturnType<typeof store.getState>;
