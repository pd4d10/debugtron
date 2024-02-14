import { reducers, type RootState } from "../reducers";
import { configureStore } from "@reduxjs/toolkit";
import * as rr from "react-redux";

const { stateSyncEnhancer } =
  require("electron-redux/renderer") as typeof import("electron-redux/renderer");

export const store = configureStore({
  reducer: reducers,
  enhancers: (getDefault) => getDefault().concat(stateSyncEnhancer()),
});

export type Dispatch = (typeof store)["dispatch"];

export const useDispatch = rr.useDispatch.withTypes<Dispatch>();
export const useSelector = rr.useSelector.withTypes<RootState>();
