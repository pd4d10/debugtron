export enum EventName {
  getApps = 'getApps',
  startDebugging = 'startDebugging',
  appStarted = 'appStarted',
}

export interface DebugPayload {
  description: string
  devtoolsFrontendUrl: string
  id: string
  title: string
  type: 'node' | 'page' | 'webview'
  url: string
}
