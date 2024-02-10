import "normalize.css/normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { AppProvider } from "./app-context";
import { SessionProvider } from "./session-context";

// @ts-expect-error for debug
window.electron = require("electron");

createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <SessionProvider>
      <App />
    </SessionProvider>
  </AppProvider>,
);
