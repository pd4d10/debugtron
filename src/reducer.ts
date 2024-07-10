import type { Reducer, ThunkDispatch } from "@reduxjs/toolkit";
import { omit } from "lodash-es";
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
      payload.sort((a, b) => (a.id < b.id ? -1 : 1));
      const record = payload.reduce<State["app"]>((p, appInfo) => {
        return { ...p, [appInfo.id]: appInfo };
      }, {});

      return { ...state, app: record };
    })
    .with({ type: "session/added" }, ({ payload }) => {
      const { sessionId, ...rest } = payload;
      return {
        ...state,
        session: {
          ...state.session,
          [sessionId]: { ...rest, page: {}, log: "" },
        },
      };
    })
    .with({ type: "session/pageUpdated" }, ({ payload }) => {
      const sessionNew = Object.keys(state.session).reduce(
        (p, sessionId, i) => {
          return {
            ...p,
            [sessionId]: {
              ...p[sessionId]!,
              page: payload[i]!.sort((a, b) => (a.id < b.id ? -1 : 1)).reduce<
                SessionInfo["page"]
              >((p, pageInfo) => {
                return { ...p, [pageInfo.id]: pageInfo };
              }, {}),
            },
          };
        },
        state.session,
      );

      return {
        ...state,
        session: sessionNew,
      };
    })
    .with({ type: "session/logAppended" }, ({ payload }) => {
      const { sessionId, content } = payload;
      const selected = state.session[sessionId];
      if (!selected) return state;
      return {
        ...state,
        session: {
          ...state.session,
          [sessionId]: {
            ...selected,
            log: selected.log + content,
          },
        },
      };
    })
    .with({ type: "session/removed" }, ({ payload }) => {
      return {
        ...state,
        session: omit(state.session, payload),
      };
    })

    .otherwise(() => {
      // TODO: exhaustive
      return state;
    });
};
