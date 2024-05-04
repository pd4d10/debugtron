import { reducer, type Action, type State } from "../reducer";
import {
  applyMiddleware,
  legacy_createStore,
  type Dispatch,
} from "@reduxjs/toolkit";
import { composeWithStateSync } from "electron-redux/renderer";
import * as rr from "react-redux";

export const store = legacy_createStore(
  reducer,
  composeWithStateSync(applyMiddleware()),
);

export const useDispatch = rr.useDispatch.withTypes<Dispatch<Action>>();
export const useSelector = rr.useSelector.withTypes<State>();
