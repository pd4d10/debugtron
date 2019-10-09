import React, { useEffect, useState } from 'react'
import { ipcRenderer, remote } from 'electron'
import { useDropzone } from 'react-dropzone'
import { Tabs, Tab, Divider, Pre } from '@blueprintjs/core'
import path from 'path'
import './app.css'
import { useSelector, useDispatch } from 'react-redux'
import { State } from '../reducer'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('')
  const { appInfo, instanceInfo } = useSelector<State, State>(s => s)
  const dispath = useDispatch()
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    noClick: true,
    onDrop(files) {
      // Find shortest path
      const [file] = files.sort((a, b) => a.path.length - b.path.length)
      if (!file) return

      ipcRenderer.send('startDebugging', {
        path: path.dirname(path.dirname(file.path)),
      })
    },
  })

  useEffect(() => {
    const instanceIds = Object.keys(instanceInfo)
    if (!activeTab && instanceIds.length) {
      setActiveTab(instanceIds[0])
    }
  }, [activeTab, instanceInfo])

  return (
    <div>
      <div style={{ display: 'flex' }}>
        {Object.entries(appInfo).map(([id, app]) => (
          <a
            key={id}
            href="#"
            onClick={e => {
              e.preventDefault()
              ipcRenderer.send('startDebugging', { id: app.id })
            }}
            // style={{ padding: 4 }}
          >
            <img
              src={app.icon || require('./images/electron.png')}
              style={{ width: 64, height: 64 }}
            />
          </a>
        ))}

        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <p>App not found? Drag your app here</p>
        </div>
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
                <Pre
                  style={{
                    overflow: 'auto',
                  }}
                >
                  {instance.log}
                </Pre>
              </div>
            }
          />
        ))}
      </Tabs>
    </div>
  )
}
