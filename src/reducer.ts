import { produce } from "immer";
import type { Reducer } from "redux";
import type { ThunkDispatch } from "redux-thunk";
import { match } from "ts-pattern";

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

type FSA<T, P = undefined> = {
  type: T;
  payload: P;
  //error: undefined
};
// | { type: T; payload: Error; error: true };

export type Action =
  | FSA<"app/loaded", AppInfo[]>
  | FSA<
      "session/added",
      { sessionId: string; appId: string; nodePort: number; windowPort: number }
    >
  | FSA<"session/pageUpdated", PageInfo[][]>
  | FSA<"session/logAppended", { sessionId: string; content: string }>
  | FSA<"session/removed", string>;

export type ThunkActionCreator<P1 = void, P2 = void> = (
  p1: P1,
  p2: P2,
) => (
  dispatch: ThunkDispatch<State, never, Action>,
  getState: () => State,
) => void;

const initialState: State = {
  app: {},
  session: {},
};

export const reducer: Reducer<State, Action> = (state, action) => {
  if (!state) return initialState;

  return match(action)
    .with({ type: "app/loaded" }, ({ payload }) => {
      return produce(state, (s) => {
        s.app = {};
        payload
          .sort((a, b) => (a.id < b.id ? -1 : 1))
          .forEach((appInfo) => {
            s.app[appInfo.id] = appInfo;
          });
      });
    })
    .with({ type: "session/added" }, ({ payload: { sessionId, ...rest } }) => {
      return produce(state, (s) => {
        s.session[sessionId] = { ...rest, page: {}, log: "" };
      });
    })
    .with({ type: "session/pageUpdated" }, ({ payload }) => {
      return produce(state, (s) => {
        Object.keys(s.session).forEach((sessionId, i) => {
          s.session[sessionId]!.page = {};

          payload[i]!.sort((a, b) => (a.id < b.id ? -1 : 1)).forEach((p) => {
            s.session[sessionId]!.page[p.id] = p;
          });
        });
      });
    })
    .with(
      { type: "session/logAppended" },
      ({ payload: { sessionId, content } }) => {
        return produce(state, (s) => {
          const selected = s.session[sessionId];
          if (selected) selected.log += content;
        });
      },
    )
    .with({ type: "session/removed" }, ({ payload }) => {
      return produce(state, (s) => {
        delete s.session[payload];
      });
    })

    .otherwise(() => {
      // TODO: exhaustive
      return state;
    });
};
