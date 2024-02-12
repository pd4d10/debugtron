import "./app.css";
import { Header } from "./header";
import { useDispatch, useSelector } from "./hooks";
import { Session } from "./session";
import { Colors } from "@blueprintjs/core";
import React, { useEffect } from "react";
import { useMedia } from "react-use";

const { ipcRenderer } = require("electron");

export const App: React.FC = () => {
  const darkMode = useMedia("(prefers-color-scheme: dark)");

  const dispatch = useDispatch();
  const appState = useSelector((s) => s.app);
  const sessionState = useSelector((s) => s.session);

  // listen to main process
  useEffect(() => {
    ipcRenderer.on("dispatch", (e, action) => {
      dispatch(action);
    });
  }, [dispatch]);

  const sessionEntries = Object.entries(sessionState);
  console.log(appState, sessionState);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: darkMode ? Colors.DARK_GRAY2 : undefined,
      }}
      className={darkMode ? "bp5-dark" : undefined}
    >
      <Header />
      <div style={{ overflowY: "auto" }}>
        {sessionEntries.length ? (
          <Session />
        ) : (
          <div
            style={{
              fontSize: 24,
              color: "#bbb",
              width: "100%",
              height: "100%",
              paddingTop: 100,
              textAlign: "center",
            }}
          >
            Click App icon to debug
          </div>
        )}
      </div>
    </div>
  );
};
