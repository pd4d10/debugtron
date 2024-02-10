import {
  FC,
  useReducer,
  Reducer,
  PropsWithChildren,
  createContext,
  Dispatch,
} from "react";

type AppId = string;
export type AppInfo = {
  id: AppId;
  name: string;
  icon: string;
  exePath: string;
  hidden?: boolean;
};
type State = {
  loading: boolean;
  info: Record<AppId, AppInfo>;
};
type Action =
  | { type: "apps_start" }
  | { type: "apps_succeed"; apps: AppInfo[] }
  | { type: "temp_app"; info: AppInfo };

export type AppDispatch = Dispatch<Action>;

const initialState: State = {
  loading: false,
  info: {},
};
const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "apps_start":
      return {
        ...state,
        loading: true,
      };
    case "apps_succeed": {
      const appsMerged = action.apps
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .reduce((s, app) => {
          return {
            ...s,
            [app.id]: app,
          };
        }, state.info);

      return {
        ...state,
        info: appsMerged,
        loading: false,
      };
    }
    case "temp_app":
      if (state.info[action.info.id]) return state;
      return {
        ...state,
        [action.info.id]: {
          ...action.info,
          hidden: true,
        },
      };

    default:
      return state;
  }
};

export const AppContext = createContext({
  state: initialState,
  dispatch: (() => {}) as Dispatch<Action>,
});

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
