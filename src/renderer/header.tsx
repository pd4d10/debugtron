import { appSlice, type AppInfo } from "../reducers/app";
import { useDispatch, useSelector } from "./hooks";
import defaultImage from "./images/electron.png";
import { noDragStyle } from "./utils";
import {
  Button,
  ControlGroup,
  InputGroup,
  MenuItem,
  Tooltip,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { useEffect, type FC, useState } from "react";

export const Header: FC = () => {
  const dispatch = useDispatch();
  const appState = useSelector((s) => s.app);
  const [input, setInput] = useState("");

  // read apps at first
  useEffect(() => {
    dispatch(appSlice.actions.read(null));
  }, [dispatch]);

  return (
    <header
      style={{
        // @ts-expect-error draggable title bar
        "-webkit-app-region": "drag",
        padding: "10px 10px 10px 80px",
        display: "flex",
      }}
    >
      <Select
        filterable
        items={Object.values(appState.info)}
        itemPredicate={(query, item) => {
          const lq = query.toLowerCase();
          return (
            item.name.toLowerCase().includes(lq) ||
            item.id.toLowerCase().includes(lq)
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
          const appInfo = appState.info[item.id];
          if (appInfo) {
            require("electron").ipcRenderer.send("debug", appInfo);
          }
        }}
      >
        <Button
          style={noDragStyle}
          text={"Select an App to debug"}
          icon="build"
          rightIcon="chevron-down"
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
      <ControlGroup style={noDragStyle}>
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
          onClick={async () => {
            const current: AppInfo | undefined =
              await require("electron").ipcRenderer.invoke(
                "read-app-by-path",
                input,
              );
            if (current) {
              dispatch(appSlice.actions.addTemp(current)); // TODO: Remove it after session closed
              require("electron").ipcRenderer.send("debug", current);
            } else {
              alert(
                "Invalid application path: " +
                  `${input} is not an Electron-based application`,
              );
            }
          }}
        />
      </ControlGroup>
    </header>
  );
};
