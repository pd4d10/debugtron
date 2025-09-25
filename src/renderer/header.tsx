import { Button, ControlGroup, InputGroup, MenuItem, Tooltip } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { type FC, useState } from "react";
import { useSelector } from "react-redux";

import { appSlice } from "../reducers/app";

import defaultImage from "./images/electron.png";

export const Header: FC = () => {
  const appState = useSelector(appSlice.selectSlice);
  const [input, setInput] = useState("");

  return (
    <header
      style={{
        padding: "10px 10px 10px 80px",
        display: "flex",
        // @ts-expect-error - Non-standard property
        WebkitAppRegion: "drag",
      }}
    >
      <Select
        menuProps={{
          style: {
            maxHeight: "calc(100vh - 100px)", // TODO:
            overflow: "auto",
          },
        }}
        filterable
        items={Object.values(appState)}
        itemPredicate={(query, item) => {
          const lq = query.toLowerCase();
          return (
            item.name.toLowerCase().includes(lq)
            || item.id.toLowerCase().includes(lq)
          );
        }}
        itemRenderer={(item, { modifiers, handleClick, handleFocus }) => {
          if (!modifiers.matchesPredicate) return null;

          return (
            <MenuItem
              key={item.id}
              text={item.name}
              label={item.id}
              onClick={handleClick}
              onFocus={handleFocus}
              icon={
                <img
                  style={{ width: 24, height: 24 }}
                  src={item.icon || defaultImage}
                />
              }
            />
          );
        }}
        onItemSelect={(item) => {
          const appInfo = appState[item.id];
          if (appInfo) {
            require("electron").ipcRenderer.send("debug", appInfo);
          }
        }}
      >
        <Button
          style={{
            // @ts-expect-error - Non-standard property
            WebkitAppRegion: "no-drag",
          }}
          text="Select an App to debug"
          icon="build"
          endIcon="chevron-down"
        />
      </Select>
      <div
        style={{
          flexGrow: 1,
          textAlign: "center",
          display: "flex",
          flexFlow: "column",
          justifyContent: "center",
        }}
      >
        Debugtron
      </div>
      <ControlGroup style={{
        // @ts-expect-error - Non-standard property
        WebkitAppRegion: "no-drag",
      }}
      >
        <Tooltip content="Input custom path here and click Debug">
          <InputGroup
            value={input}
            placeholder="App not found?"
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
        </Tooltip>
        <Button
          text="Debug"
          icon="build"
          onClick={() => {
            require("electron").ipcRenderer.send("debug-path", input);
          }}
        />
      </ControlGroup>
    </header>
  );
};
