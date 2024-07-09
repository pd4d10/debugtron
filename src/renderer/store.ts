import { reducer, type State } from "../reducer";
import { applyMiddleware, legacy_createStore } from "@reduxjs/toolkit";
import { composeWithStateSync } from "electron-redux/renderer";
import * as rr from "react-redux";

export const store = legacy_createStore(
  reducer,
  composeWithStateSync(applyMiddleware()),
);

export const useSelector = rr.useSelector.withTypes<State>();
export const appSelector = (s: State) => s.app;
export const sessionSelector = (s: State) => s.session;
