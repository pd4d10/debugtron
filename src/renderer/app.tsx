import React, { useEffect, useState, useContext } from 'react'
import { ipcRenderer, remote } from 'electron'
import { Tabs, Tab, Divider, Tag } from '@blueprintjs/core'
import { PageInfo, EventName, AppInfo } from '../types'
import { AppContext } from './store'
import { Term } from './term'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('')
  const { appInfo, instanceInfo } = useContext(AppContext)

  useEffect(() => {
    const instanceIds = Object.keys(instanceInfo)
    if (!activeTab && instanceIds.length) {
      setActiveTab(instanceIds[0])
    }
  }, [activeTab, instanceInfo])

  return (
    <div>
      <div>
        {Object.entries(appInfo).map(([id, payload]) => (
          <Tag
            key={id}
            large
            round
            interactive
            minimal
            onClick={() => {
              ipcRenderer.send(EventName.startDebugging, payload)
            }}
          >
            {payload.name}
          </Tag>
        ))}
      </div>

      <Divider />

      <Tabs
        selectedTabId={activeTab}
        onChange={key => {
          setActiveTab(key as string)
        }}
      >
        {Object.entries(instanceInfo).map(([id, instance]) => (
          <Tab
            id={id}
            key={id}
            title={appInfo[instance.appId].name}
            panel={
              <div>
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
                <Term message={instance.log} />
              </div>
            }
          />
        ))}
      </Tabs>
    </div>
  )
}
