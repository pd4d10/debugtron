import React, { FC, createContext, useState, useEffect } from 'react'
import { AppInfo, EventName, PageInfo, Dict } from '../types'
import { ipcRenderer } from 'electron'

export const AppContext = createContext({ appInfo: {}, instanceInfo: {} } as {
  appInfo: Dict<AppInfo>
  instanceInfo: Dict<InstancePayload>
})

interface InstancePayload {
  appId: string
  pages: PageInfo[]
  log: string
}

export const AppProvider: FC = ({ children }) => {
  const [appInfo, setAppInfo] = useState({} as Dict<AppInfo>)
  const [instanceInfo, setInstanceInfo] = useState({} as Dict<InstancePayload>)

  useEffect(() => {
    setAppInfo(ipcRenderer.sendSync(EventName.getApps))
  }, [])

  useEffect(() => {
    const onPrepare = (
      e: Electron.Event,
      instanceId: string,
      appId: string,
    ) => {
      setInstanceInfo(instanceInfo => {
        return {
          ...instanceInfo,
          [instanceId]: { appId, pages: [], log: '' },
        }
      })
    }

    ipcRenderer.on(EventName.appPrepare, onPrepare)
    return () => {
      ipcRenderer.removeListener(EventName.appPrepare, onPrepare)
    }
  }, [])

  useEffect(() => {
    const onAppStarted = (
      e: Electron.Event,
      instanceId: string,
      pages: PageInfo[],
    ) => {
      setInstanceInfo(instanceInfo => {
        instanceInfo[instanceId].pages = pages
        return { ...instanceInfo }
      })
    }

    ipcRenderer.on(EventName.appStarted, onAppStarted)
    return () => {
      ipcRenderer.removeListener(EventName.appStarted, onAppStarted)
    }
  }, [])

  useEffect(() => {
    const onLog = (e: Electron.Event, instanceId: string, message: string) => {
      setInstanceInfo(instanceInfo => {
        instanceInfo[instanceId].log += message
        return { ...instanceInfo }
      })
    }

    ipcRenderer.on(EventName.log, onLog)
    return () => {
      ipcRenderer.removeListener(EventName.log, onLog)
    }
  }, [])

  return (
    <AppContext.Provider value={{ appInfo, instanceInfo }}>
      {children}
    </AppContext.Provider>
  )
}

// export const PageContext = createContext([] as PageInfo[])

// export const PageStore: FC = ({ children }) => {
//   const [pages, setPages] = useState([] as PageInfo[])

//   useEffect(() => {})

//   return <PageContext.Provider value={pages}>{children}</PageContext.Provider>
// }
