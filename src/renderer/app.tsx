import React, { useEffect, useState, useContext } from 'react'
import { ipcRenderer, remote } from 'electron'
import { Tabs, Tab, Divider } from '@blueprintjs/core'
import { PageInfo, EventName, AppInfo } from '../types'
import { AppContext } from './store'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('0')
  const { appInfo, instances } = useContext(AppContext)

  return (
    <div>
      <div>
        {Object.entries(appInfo).map(([id, payload]) => (
          <div
            style={{
              cursor: 'pointer',
            }}
            onClick={() => {
              ipcRenderer.send(EventName.startDebugging, payload)
            }}
          >
            {payload.name}
          </div>
        ))}
      </div>

      <Divider />

      <Tabs
        selectedTabId={activeTab}
        onChange={key => {
          setActiveTab(key as string)
        }}
      >
        {instances.map(instance => (
          <Tab id={instance.appId} key={instance.appId}>
            {instance.pages.map(page => (
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
