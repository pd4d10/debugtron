import type { ThunkDispatch } from "redux-thunk";

export type AppInfo = {
  id: string;
  name: string;
  icon: string;
  exePath: string;
};
export type PageInfo = {
  description: string;
  devtoolsFrontendUrl: string;
  id: string;
  title: string;
  type: "node" | "page" | "webview";
  url: string;
};
export type SessionInfo = {
  appId: string;
  page: Record<string, PageInfo>;
  log: string;
  nodePort: number;
  windowPort: number;
};

export type State = {
  app: Record<string, AppInfo>;
  session: Record<string, SessionInfo>;
};

export type ThunkActionCreator<P1 = void, P2 = void> = (
  p1: P1,
  p2: P2,
) => (
  dispatch: ThunkDispatch<State, never, any>,
  getState: () => State,
) => void;
