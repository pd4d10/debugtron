import type { Result } from "ts-results";

import type { AppInfo } from "../../reducers/app";

export interface AppReader {
  readAll(): Promise<Result<AppInfo[], Error>>;
  readByPath(p: string): Promise<Result<AppInfo, Error>>;
}
