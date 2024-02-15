import type { AppInfo } from "../reducers/app";

export interface AppReader {
  readAll(): Promise<(AppInfo | undefined)[]>;
  readByPath(p: string): Promise<AppInfo | undefined>;
}
