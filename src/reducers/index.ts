import * as rr from "react-redux";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { appSlice } from "./app";
import { sessionSlice } from "./session";

const reducer = combineSlices(appSlice, sessionSlice);
export const store = configureStore({ reducer });

export type Dispatch = (typeof store)["dispatch"];

export const useDispatch =
  rr.useDispatch.withTypes<(typeof store)["dispatch"]>();
export const useSelector =
  rr.useSelector.withTypes<ReturnType<typeof reducer>>();
