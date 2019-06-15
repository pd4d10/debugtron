import React, { FC, createContext, useState, useEffect } from 'react'
import { AppInfo, EventName, PageInfo, Dict } from '../types'
import { ipcRenderer } from 'electron'

export const AppContext = createContext({ appInfo: {}, instances: [] } as {
  appInfo: Dict<AppInfo>
  instances: InstancePayload[]
})

interface InstancePayload {
  appId: string
  pages: PageInfo[]
}

export const AppProvider: FC = ({ children }) => {
  const [appInfo, setAppInfo] = useState({} as Dict<AppInfo>)
  const [instances, setInstances] = useState([] as InstancePayload[])

  useEffect(() => {
    setAppInfo(ipcRenderer.sendSync(EventName.getApps))
  }, [])

  useEffect(() => {
    const onAppStarted = (e: Electron.Event, payload: InstancePayload) => {
      setInstances(instances => [...instances, payload])
    }

    ipcRenderer.on(EventName.appStarted, onAppStarted)
    return () => {
      ipcRenderer.removeListener(EventName.appStarted, onAppStarted)
    }
  }, [])

  return (
    <AppContext.Provider value={{ appInfo, instances }}>
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
