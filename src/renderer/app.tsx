import React, { useEffect, useState } from 'react'
import { ipcRenderer, remote } from 'electron'
import { Tabs, Tab } from '@blueprintjs/core'
import { DebugPayload, EventName, AppInfo } from '../types'

export const App: React.FC = () => {
  const [apps, setApps] = useState([] as AppInfo[])
  const [activeTab, setActiveTab] = useState('0')
  const [tabs, setTabs] = useState([] as {
    app: AppInfo
    pages: DebugPayload[]
  }[])

  useEffect(() => {
    setApps(ipcRenderer.sendSync(EventName.getApps))
  }, [])

  useEffect(() => {
    const onAppStarted = (
      e: Electron.Event,
      payload: {
        app: AppInfo
        pages: DebugPayload[]
      },
    ) => {
      setTabs(tabs => [...tabs, payload])
    }

    ipcRenderer.on(EventName.appStarted, onAppStarted)
    return () => {
      ipcRenderer.removeListener(EventName.appStarted, onAppStarted)
    }
  }, [])

  return (
    <div>
      <div>
        {apps.map(app => (
          <div
            onClick={() => {
              ipcRenderer.send(EventName.startDebugging, app)
            }}
          >
            {app.name}
          </div>
        ))}
      </div>

      <Tabs
        selectedTabId={activeTab}
        onChange={key => {
          setActiveTab(key as string)
        }}
      >
        {tabs.map(tab => (
          <Tab id={tab.app.id} key={tab.app.id}>
            {tab.pages.map(page => (
              <div key={page.id}>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault()
                    const win = new remote.BrowserWindow()
                    win.loadURL(
                      page.devtoolsFrontendUrl.replace(
                        /^\/devtools/,
                        'chrome-devtools://devtools/bundled',
                      ),
                    )
                  }}
                >
                  {page.title}
                </a>
              </div>
            ))}
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}
