import { appSlice } from "../reducers/app";
import "./app.css";
import { Dnd } from "./dnd";
import { useDispatch, useSelector } from "./hooks";
import defaultImage from "./images/electron.png";
import { Session } from "./session";
import { Divider, Spinner, Button } from "@blueprintjs/core";
import React, { useEffect } from "react";

const { ipcRenderer } = require("electron");

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const appState = useSelector((s) => s.app);
  const sessionState = useSelector((s) => s.session);

  // listen to main process
  useEffect(() => {
    ipcRenderer.on("dispatch", (e, action) => {
      dispatch(action);
    });
  }, [dispatch]);

  // read apps at first
  useEffect(() => {
    dispatch(appSlice.actions.read(null));
  }, [dispatch]);

  const sessionEntries = Object.entries(sessionState);
  console.log(appState, sessionState);

  return (
    <div
      style={{
        height: "100vh",
        padding: "1px 8px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3>
        Installed Electron-based App (Click to debug){"  "}
        <Button
          small
          icon="refresh"
          onClick={() => {
            dispatch(appSlice.actions.read(null));
          }}
        >
          Refresh
        </Button>
      </h3>
      <div style={{ display: "flex" }}>
        {appState.status === "loading" ? (
          <Spinner />
        ) : (
          <div style={{ display: "flex", flexGrow: 1, overflowX: "auto" }}>
            {Object.entries(appState.info).map(([id, app]) => {
              if (app.hidden) return null;

              return (
                <a
                  key={id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    ipcRenderer.send("debug", app);
                  }}
                  style={{ padding: 4, textAlign: "center", width: 100 }}
                  className="hoverable"
                >
                  <img
                    src={app.icon || defaultImage}
                    style={{ width: 64, height: 64 }}
                  />
                  <div style={{ wordBreak: "break-word" }}>{app.name}</div>
                </a>
              );
            })}
          </div>
        )}
        <Divider />
        <Dnd />
      </div>

      <Divider />

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
