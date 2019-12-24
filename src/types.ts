export type Dict<T> = { [key: string]: T }

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
  exePath: string
  hidden?: boolean
}

export interface SessionInfo {
  appId: string
  pages: Dict<PageInfo>
  log: string
  nodePort: string
  windowPort: string
}

export interface MacosAppInfo {
  CFBundleIdentifier: string
  CFBundleName: string
  CFBundleExecutable: string
  CFBundleIconFile: string
}
