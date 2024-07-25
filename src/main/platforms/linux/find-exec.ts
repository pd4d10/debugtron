import fs from "fs";
import path from "path";

const pathDirs = process.env.PATH?.split(path.delimiter)?.filter((dir) => fs.existsSync(dir)) || [];

export function findExecPath(command: string) {
  for (const pathDir of pathDirs) {
    const execPath = path.join(pathDir, command);
    if (!fs.existsSync(execPath)) {
      continue;
    }
    if (!fs.statSync(execPath).isFile()) {
      continue;
    }
    const lstat = fs.lstatSync(execPath);
    if (!lstat.isSymbolicLink()) {
      return execPath;
    }
    const realpath = fs.realpathSync(execPath);
    if (!fs.existsSync(realpath)) {
      continue;
    }
    return realpath;
  }
}
