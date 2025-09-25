import { App } from "./app";
import { store } from "./store";

import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css/normalize.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
