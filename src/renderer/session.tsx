import { appSelector, sessionSelector, useSelector } from "./store";
import {
  Tabs,
  Tab,
  Divider,
  Pre,
  Tag,
  HTMLTable,
  Button,
} from "@blueprintjs/core";
import { useEffect, type FC, useState } from "react";

export const Session: FC = () => {
  const [activeId, setActiveId] = useState("");
  const appState = useSelector(appSelector);
  const sessionState = useSelector(sessionSelector);

  useEffect(() => {
    const sessionIds = Object.keys(sessionState);

    // Ensure there always be one tab active
    if (!sessionIds.includes(activeId) && sessionIds[0]) {
      setActiveId(sessionIds[0]);
    }
  }, [activeId, sessionState]);

  return (
    <Tabs
      selectedTabId={activeId}
      onChange={(key) => {
        setActiveId(key as string);
      }}
    >
      {Object.entries(sessionState).map(([id, session]) => {
        const appInfo = appState[session.appId];

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
                  maxHeight: "calc(100vh - 100px)", // TODO:
                }}
              >
                <HTMLTable
                  compact
                  interactive
                  style={{
                    marginTop: 5,
                  }}
                >
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
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
                              const url = page.devtoolsFrontendUrl
                                .replace(
                                  /^\/devtools/,
                                  "devtools://devtools/bundled",
                                )
                                .replace(
                                  /^chrome-devtools:\/\//,
                                  "devtools://",
                                );

                              require("electron").ipcRenderer.send(
                                "open-window",
                                url,
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
                <Divider />
                <Pre
                  style={{
                    marginTop: 5,
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
        );
      })}
    </Tabs>
  );
};
