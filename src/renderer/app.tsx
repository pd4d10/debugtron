import React, { useEffect, useState } from 'react'
import { ipcRenderer, remote } from 'electron'
import { DebugPayload, EventName, AppInfo } from '../types'

export const App: React.FC = () => {
  const [apps, setApps] = useState([] as AppInfo[])
  const [payloads, setPayloads] = useState([] as DebugPayload[])

  useEffect(() => {
    setApps(ipcRenderer.sendSync(EventName.getApps))
  }, [])

  useEffect(() => {
    const onAppStarted = (e: Electron.Event, _payloads: DebugPayload[]) => {
      console.log(_payloads)
      setPayloads(_payloads)
    }

    ipcRenderer.on(EventName.appStarted, onAppStarted)
    return () => {
      ipcRenderer.removeListener(EventName.appStarted, onAppStarted)
    }
  }, [])

  return (
    <div>
      <div>a</div>
      {apps.map(app => (
        <div key={app.id}>
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              ipcRenderer.send(EventName.startDebugging, app)
            }}
          >
            {app.name}
          </a>
        </div>
      ))}
      <div>
        {payloads.map(payload => (
          <a
            href="#"
            key={payload.id}
            onClick={e => {
              e.preventDefault()
              const win = new remote.BrowserWindow()
              win.loadURL(
                payload.devtoolsFrontendUrl.replace(
                  /^\/devtools/,
                  'chrome-devtools://devtools/bundled',
                ),
              )
            }}
          >
            <div>{payload.type}</div>
            <div>{payload.title}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
