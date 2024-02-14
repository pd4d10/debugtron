import { appSlice } from "./app";
import { sessionSlice } from "./session";
import { combineSlices } from "@reduxjs/toolkit";

export const reducers = combineSlices(appSlice, sessionSlice);
export type RootState = ReturnType<typeof reducers>;
