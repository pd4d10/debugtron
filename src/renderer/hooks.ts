import type { Dispatch, RootState } from "../reducers";
import * as rr from "react-redux";

export const useDispatch = rr.useDispatch.withTypes<Dispatch>();
export const useSelector = rr.useSelector.withTypes<RootState>();
