import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Tabs,
  Tab,
  Divider,
  Pre,
  Tag,
  Spinner,
  HTMLTable,
  Button,
} from "@blueprintjs/core";
import defaultImage from "./images/electron.png";
import "./app.css";
import { AppContext, AppInfo } from "./app-context";
import { PageInfo, SessionContext } from "./session-context";

const { ipcRenderer } = require("electron");

export const App: React.FC = () => {
  const [activeId, setActiveId] = useState("");
  const [appState, appDispatch] = useContext(AppContext);
  const [sessionState, sessionDispatch] = useContext(SessionContext);

  const readApps = useCallback(async () => {
    appDispatch({ type: "apps_start" });
    const apps: AppInfo[] = await ipcRenderer.invoke("read-apps");
    appDispatch({ type: "apps_succeed", apps });
  }, [appDispatch]);

  const fetchPages = useCallback(async () => {
    for (let [id, info] of Object.entries(sessionState)) {
      const ports: number[] = [];
      if (info.nodePort) ports.push(info.nodePort);
      if (info.windowPort) ports.push(info.windowPort);

      const payloads = await Promise.allSettled<PageInfo>(
        ports.map((port) =>
          fetch(`http://127.0.0.1:${port}/json`).then((res) => res.json()),
        ),
      );

      const pages = payloads.flatMap((p) =>
        p.status === "fulfilled" ? p.value : [],
      );
      if (pages.length === 0) return;

      sessionDispatch({ type: "pages", sessionId: id, pages: pages });
    }
  }, [sessionDispatch, sessionState]);

  const { getRootProps, getInputProps } = useDropzone({
    noClick: process.platform === "darwin",
    onDropAccepted: async ([file]) => {
      if (!file) return;

      const p = file.path;
      const duplicated = Object.values(appState.info).find(
        (a) => a.exePath === p,
      );
      if (duplicated) {
        ipcRenderer.send("debug", duplicated);
      } else {
        const current: AppInfo | undefined = await ipcRenderer.invoke(
          "read-app-by-path",
          p,
        );
        if (current) {
          appDispatch({ type: "temp_app", info: current }); // TODO: Remove it after session closed
          ipcRenderer.send("debug", duplicated);
        } else {
          alert(
            "Invalid application path: " +
              `${p} is not an Electron-based application`,
          );
        }
      }
    },
    async getFilesFromEvent(e: any) {
      // Drop
      if (e.dataTransfer && e.dataTransfer.files) {
        const fileList = e.dataTransfer.files as FileList;
        return [...fileList];
      }

      // Click
      if (e.target && e.target.files) {
        const fileList = e.target.files as FileList;
        return [...fileList];
      }

      return [];
    },
  });

  useEffect(() => {
    const sessionIds = Object.keys(sessionState);

    // Ensure there always be one tab active
    if (!sessionIds.includes(activeId) && sessionIds[0]) {
      setActiveId(sessionIds[0]);
    }
  }, [activeId, sessionState]);

  useEffect(() => {
    // listen to main process
    // ipcRenderer.on("app-dispatch", (e, action) => {
    //   appDispatch(action);
    // });
    ipcRenderer.on("session-dispatch", (e, action) => {
      sessionDispatch(action);
    });
  }, [sessionDispatch]);

  // only first time
  useEffect(() => {
    readApps();
  }, [readApps]);

  // set timer
  useEffect(() => {
    const timer = setInterval(fetchPages, 3000);
    return () => {
      clearInterval(timer);
    };
  }, [fetchPages]);

  const sessionEntries = Object.entries(sessionState);
  // console.log(app, session)

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
            readApps();
          }}
        >
          Refresh
        </Button>
      </h3>
      <div style={{ display: "flex" }}>
        {appState.loading ? (
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
        <div
          {...getRootProps({
            style: {
              padding: 20,
              borderWidth: 2,
              borderRadius: 2,
              borderColor: "#eeeeee",
              borderStyle: "dashed",
              backgroundColor: "#fafafa",
              color: "#aaa",
              outline: "none",
              transition: "border 0.24s ease-in-out",
              display: "flex",
              marginTop: 10,
              marginBottom: 10,
              cursor: "pointer",
            },
          })}
        >
          <input {...getInputProps()} />
          <p style={{ alignSelf: "center" }}>
            App not found? Drag your app here
          </p>
        </div>
      </div>

      <Divider />

      <div style={{ overflowY: "auto" }}>
        {sessionEntries.length ? (
          <Tabs
            selectedTabId={activeId}
            onChange={(key) => {
              setActiveId(key as string);
            }}
          >
            {sessionEntries.map(([id, session]) => (
              <Tab
                id={id}
                key={id}
                title={appState.info[session.appId]?.name}
                panel={
                  <div style={{ display: "flex", marginTop: -20 }}>
                    <div>
                      <h3>Sessions (Click to open)</h3>
                      <HTMLTable compact interactive>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(session.pages).map(([id, page]) => (
                            <tr key={id}>
                              <td>
                                <Tag
                                  intent={
                                    page.type === "node"
                                      ? "success"
                                      : page.type === "page"
                                        ? "primary"
                                        : "none"
                                  }
                                >
                                  {page.type}
                                </Tag>
                              </td>
                              <td
                                style={{
                                  maxWidth: 200,
                                  wordWrap: "break-word",
                                }}
                              >
                                {page.title}
                              </td>
                              <td>
                                <Button
                                  small
                                  rightIcon="share"
                                  onClick={() => {
                                    ipcRenderer.send(
                                      "open-window",
                                      page.devtoolsFrontendUrl
                                        .replace(
                                          /^\/devtools/,
                                          "devtools://devtools/bundled",
                                        )
                                        .replace(
                                          /^chrome-devtools:\/\//,
                                          "devtools://",
                                        ),
                                    );
                                  }}
                                >
                                  Inspect
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </HTMLTable>
                    </div>
                    <Divider />
                    <Pre
                      style={{
                        flexGrow: 1,
                        overflow: "auto",
                        userSelect: "text",
                        fontFamily:
                          "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
                      }}
                    >
                      {session.log}
                    </Pre>
                  </div>
                }
              />
            ))}
          </Tabs>
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
