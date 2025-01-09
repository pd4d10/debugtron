import {
  Button,
  Divider,
  HTMLTable,
  Pre,
  Tab,
  Tabs,
  Tag
} from "@blueprintjs/core";
import { type FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { appSlice } from "../reducers/app";
import { sessionSlice } from "../reducers/session";
import { Xterm } from "./xterm";

export const Session: FC = () => {
  const [activeId, setActiveId] = useState("");
  const appStore = useSelector(appSlice.selectSlice);
  const sessionStore = useSelector(sessionSlice.selectSlice);

  useEffect(() => {
    const sessionIds = Object.keys(sessionStore);

    // Ensure there always be one tab active
    if (!sessionIds.includes(activeId) && sessionIds[0]) {
      setActiveId(sessionIds[0]);
    }
  }, [activeId, sessionStore]);

  console.log(666644, appStore, sessionStore);

  return (
    <Tabs
      selectedTabId={activeId}
      onChange={(key) => {
        setActiveId(key as string);
      }}
    >
      {Object.entries(sessionStore).map(([id, session]) => {
        const appInfo = appStore[session.appId];

        return (
          <Tab
            style={{ overflowY: "auto" }}
            id={id}
            key={id}
            title={appInfo?.name}
            panel={
              <div
                style={{
                  display: "flex",
                  marginTop: -20,
                  overflow: "auto",
                  maxHeight: "calc(100vh - 100px)" // TODO:
                }}
              >
                <div style={{ marginTop: 5, overflow: "auto", flexShrink: 0 }}>
                  <HTMLTable compact interactive>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th style={{ minWidth: 160, maxWidth: 160 }}>Title</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(session.page).map(([id, page]) => (
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
                              minWidth: 160,
                              maxWidth: 160,
                              wordWrap: "break-word"
                            }}
                          >
                            {page.title}
                          </td>
                          <td>
                            <Button
                              small
                              rightIcon="share"
                              onClick={() => {
                                const url = page.devtoolsFrontendUrl
                                  .replace(
                                    /^\/devtools/,
                                    "devtools://devtools/bundled"
                                  )
                                  .replace(
                                    /^chrome-devtools:\/\//,
                                    "devtools://"
                                  );

                                require("electron").ipcRenderer.send(
                                  "open-window",
                                  url
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
                <div
                  style={{
                    marginTop: 5,
                    flexGrow: 1,
                    overflow: "auto"
                  }}
                >
                  <Xterm
                    content={session.log}
                    options={{
                      fontFamily:
                        "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
                      convertEol: true
                    }}
                  />
                </div>
              </div>
            }
          />
        );
      })}
    </Tabs>
  );
};
