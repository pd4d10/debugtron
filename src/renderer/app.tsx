import React, { useEffect, useState } from 'react'
import { ipcRenderer, remote } from 'electron'
import { Select, Button, Tabs } from 'antd'
import { DebugPayload, EventName, AppInfo } from '../types'

export const App: React.FC = () => {
  const [selected, setSelected] = useState('')
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
        <Select
          value={selected || undefined}
          placeholder="Choose app here"
          onChange={value => {
            setSelected(value)
          }}
          style={{ minWidth: 200 }}
        >
          {apps.map(app => (
            <Select.Option value={app.id}>{app.name}</Select.Option>
          ))}
        </Select>
        <Button
          onClick={e => {
            e.preventDefault()
            const app = apps.find(item => item.id === selected)
            if (!app) return alert('no app')

            ipcRenderer.send(EventName.startDebugging, app)
          }}
        >
          Debug
        </Button>
      </div>

      <Tabs
        type="editable-card"
        activeKey={activeTab}
        onChange={key => {
          setActiveTab(key)
        }}
        // onEdit={}
      >
        {tabs.map((tab, index) => (
          <Tabs.TabPane tab={tab.app.name} key={index.toString()}>
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
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  )
}
