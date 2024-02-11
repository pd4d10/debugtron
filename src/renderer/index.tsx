import "normalize.css/normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Provider } from "react-redux";
import { store } from "../reducers";

// @ts-expect-error for debug
window.electron = require("electron");

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
