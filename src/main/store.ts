import { appSlice } from "../reducers/app";
import { sessionSlice } from "../reducers/session";
import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/types/main";

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    session: sessionSlice.reducer,
  },
  enhancers: (g) => g().concat(stateSyncEnhancer()),
});
