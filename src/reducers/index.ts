import { appSlice } from "./app";
import { sessionSlice } from "./session";
import { combineSlices, configureStore } from "@reduxjs/toolkit";

const reducer = combineSlices(appSlice, sessionSlice);
export const store = configureStore({ reducer });

export type RootState = ReturnType<typeof reducer>;
export type Dispatch = (typeof store)["dispatch"];
