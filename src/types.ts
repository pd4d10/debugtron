export interface PageInfo {
  description: string
  devtoolsFrontendUrl: string
  id: string
  title: string
  type: 'node' | 'page' | 'webview'
  url: string
}

export interface AppInfo {
  id: string
  name: string
  icon: string
  appPath: string
  exePath: string
}

export interface InstancePayload {
  appId: string
  pages: PageInfo[]
  log: string
}

export type Dict<T> = { [key: string]: T }
