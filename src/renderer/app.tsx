import { sessionSlice } from "../reducers/session";
import "./app.css";
import { Colors } from "@blueprintjs/core";
import React from "react";
import { useSelector } from "react-redux";
import { useMedia } from "react-use";
import { Header } from "./header";
import { Session } from "./session";

export const App: React.FC = () => {
  const darkMode = useMedia("(prefers-color-scheme: dark)");
  const sessionStore = useSelector(sessionSlice.selectSlice);

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
      <div style={{ flexGrow: 1, paddingLeft: 16, paddingRight: 16 }}>
        {Object.entries(sessionStore).length ? <Session /> : (
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
