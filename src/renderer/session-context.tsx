import {
  Dispatch,
  FC,
  PropsWithChildren,
  Reducer,
  createContext,
  useReducer,
} from "react";
import { v4 } from "uuid";

type SessionId = string;
type PageId = string;
export type PageInfo = {
  description: string;
  devtoolsFrontendUrl: string;
  id: PageId;
  title: string;
  type: "node" | "page" | "webview";
  url: string;
};
type SessionInfo = {
  appId: string;
  pages: Record<string, PageInfo>;
  log: string;
  nodePort: number;
  windowPort: number;
};
type State = Record<SessionId, SessionInfo>;
type Action =
  | {
      type: "add";
      sessionId: SessionId;
      appId: string;
      nodePort: number;
      windowPort: number;
    }
  | { type: "remove"; sessionId: SessionId }
  | { type: "pages"; sessionId: string; pages: PageInfo[] }
  | { type: "log"; sessionId: string; text: string };

export type SessionDispatch = Dispatch<Action>;

const initialState: State = {};
const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "add": {
      return {
        ...state,
        [action.sessionId]: {
          appId: action.appId,
          nodePort: action.nodePort,
          windowPort: action.windowPort,
          pages: {},
          log: "",
        },
      };
    }
    case "remove": {
      const copy = { ...state };
      delete copy[action.sessionId];
      return copy;
    }
    case "pages": {
      return action.pages
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .reduce((s, page) => {
          return {
            ...s,
            [action.sessionId]: {
              ...s[action.sessionId],
              pages: {
                ...s[action.sessionId].pages,
                [page.id]: page,
              },
            },
          };
        }, state);
    }
    case "log":
      return {
        ...state,
        [action.sessionId]: {
          ...state[action.sessionId],
          log: state[action.sessionId].log + action.text,
        },
      };
    default:
      return state;
  }
};

export const SessionContext = createContext([
  initialState,
  (() => {}) as Dispatch<Action>,
] as const);

export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SessionContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </SessionContext.Provider>
  );
};
