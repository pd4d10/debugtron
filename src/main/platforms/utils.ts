import type { AppInfo } from "../../reducers/app";
import { Result } from "ts-results";

export interface AppReader {
  readAll(): Promise<Result<AppInfo[], Error>>;
  readByPath(p: string): Promise<Result<AppInfo, Error>>;
}
