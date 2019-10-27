import { AppInfo } from '../types'

export abstract class Adapter {
  abstract readApps(): Promise<(AppInfo | undefined)[]>
  abstract readAppByPath(p: string): Promise<AppInfo | undefined>
}
