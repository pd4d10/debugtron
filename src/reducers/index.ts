import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { appSlice } from "./app";
import { sessionSlice } from "./session";

const reducer = combineSlices(appSlice, sessionSlice);
export const store = configureStore({ reducer });

export type RootState = ReturnType<typeof reducer>;
export type Dispatch = (typeof store)["dispatch"];
