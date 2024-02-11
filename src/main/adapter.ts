import type { AppInfo } from "../reducers/app";

export abstract class Adapter {
  abstract readApps(): Promise<(AppInfo | undefined)[]>;
  abstract readAppByPath(p: string): Promise<AppInfo | undefined>;
}
