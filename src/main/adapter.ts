import { AppInfo } from "../renderer/app-context";

export abstract class Adapter {
  abstract readApps(): Promise<(AppInfo | undefined)[]>;
  abstract readAppByPath(p: string): Promise<AppInfo | undefined>;
}
