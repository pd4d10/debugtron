import * as rr from "react-redux";
import type { Dispatch, RootState } from "../reducers";

export const useDispatch = rr.useDispatch.withTypes<Dispatch>();
export const useSelector = rr.useSelector.withTypes<RootState>();
