import { appSlice, type AppInfo } from "../reducers/app";
import { useDispatch, useSelector } from "./hooks";
import type { FC } from "react";
import { useDropzone } from "react-dropzone";

export const Dnd: FC = () => {
  const dispatch = useDispatch();
  const appState = useSelector((s) => s.app);

  const { getRootProps, getInputProps } = useDropzone({
    noClick: process.platform === "darwin",
    onDropAccepted: async ([file]) => {
      if (!file) return;

      const p = file.path;
      const duplicated = Object.values(appState.info).find(
        (a) => a.exePath === p,
      );
      if (duplicated) {
        require("electron").ipcRenderer.send("debug", duplicated);
      } else {
        const current: AppInfo | undefined =
          await require("electron").ipcRenderer.invoke("read-app-by-path", p);
        if (current) {
          dispatch(appSlice.actions.addTemp(current)); // TODO: Remove it after session closed
          require("electron").ipcRenderer.send("debug", current);
        } else {
          alert(
            "Invalid application path: " +
              `${p} is not an Electron-based application`,
          );
        }
      }
    },
    async getFilesFromEvent(e) {
      const files =
        // @ts-expect-error no dataTransfer
        e.dataTransfer?.files ?? // drop
        // @ts-expect-error target type
        e.target?.files; // click

      if (files) {
        const fileList = files as FileList;
        return [...fileList];
      } else {
        return [];
      }
    },
  });

  return (
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
      <p style={{ alignSelf: "center" }}>App not found? Drag your app here</p>
    </div>
  );
};
