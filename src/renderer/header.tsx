import { appSlice } from "../reducers/app";
import { useDispatch, useSelector } from "./hooks";
import defaultImage from "./images/electron.png";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { useEffect, type FC } from "react";

export const Header: FC = () => {
  const dispatch = useDispatch();
  const appState = useSelector((s) => s.app);

  // read apps at first
  useEffect(() => {
    dispatch(appSlice.actions.read(null));
  }, [dispatch]);

  return (
    <header
      style={{
        // @ts-expect-error draggable title bar
        "-webkit-app-region": "drag",
        padding: "10px 0 10px 80px",
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
          style={{
            // @ts-expect-error disable drag
            "-webkit-app-region": "no-drag",
          }}
          text={"Select an App to debug"}
          icon="build"
          rightIcon="chevron-down"
        />
      </Select>
    </header>
  );
};
