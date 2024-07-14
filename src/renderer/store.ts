import { reducer, type State } from "../reducer";
import { composeWithStateSync } from "electron-redux/renderer";
import * as rr from "react-redux";
import { applyMiddleware, legacy_createStore } from "redux";
import logger from "redux-logger";

export const store = legacy_createStore(
  reducer,
  composeWithStateSync(applyMiddleware(logger)),
);

export const useSelector = rr.useSelector.withTypes<State>();
export const appSelector = (s: State) => s.app;
export const sessionSelector = (s: State) => s.session;
