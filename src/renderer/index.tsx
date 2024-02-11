import { store } from "../reducers";
import { App } from "./app";
import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css/normalize.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

// @ts-expect-error for debug
window.electron = require("electron");

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
