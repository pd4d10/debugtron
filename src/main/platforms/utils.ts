import type { AppInfo } from "../../reducer";
import { Result } from "ts-results";

export interface AppReader {
  readAll(): Promise<Result<AppInfo[], Error>>;
  readByPath(p: string): Promise<Result<AppInfo, Error>>;
}
