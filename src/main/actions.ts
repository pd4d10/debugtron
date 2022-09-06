import { v4 } from 'uuid'
import path from 'path'
import { spawn } from 'child_process'
import { updatePages } from '../reducers/session'
import { PageInfo, Dict, AppInfo } from '../types'
import fetch from 'node-fetch'
import { addSession, updateLog, removeSession } from '../reducers/session'
import { State } from '../reducers'
import { dialog } from 'electron'
import getPort from 'get-port'
import { ThunkAction } from 'redux-thunk'
import { Adapter } from './adapter'
import { getApps, getAppStart } from '../reducers/app'

export const fetchPages =
  (): ThunkAction<any, State, any, any> => async (dispatch, getState) => {
    const { sessionInfo } = getState()
    for (let [id, info] of Object.entries(sessionInfo)) {
      const ports: string[] = []
      if (info.nodePort) ports.push(info.nodePort)
      if (info.windowPort) ports.push(info.windowPort)

      const payloads = await Promise.allSettled<PageInfo>(
        ports.map((port) =>
          fetch(`http://127.0.0.1:${port}/json`).then((res) => res.json())
        ) as any
      )

      const pages = payloads.flatMap((p) =>
        p.status === 'fulfilled' ? p.value : []
      )
      if (pages.length === 0) return

      const pageDict = {} as Dict<PageInfo>
      pages
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .forEach((page) => {
          pageDict[page.id] = page
        })

      dispatch(updatePages(id, pageDict))
    }
  }

export const startDebugging =
  (app: AppInfo): ThunkAction<any, State, any, any> =>
  async (dispatch, getState) => {
    const nodePort = await getPort()
    const windowPort = await getPort()

    const sp = spawn(
      app.exePath,
      [`--inspect=${nodePort}`, `--remote-debugging-port=${windowPort}`],
      {
        cwd: process.platform === 'win32' ? path.dirname(app.exePath) : '/',
      }
    )

    const id = v4()
    dispatch(addSession(id, app.id, nodePort, windowPort))

    sp.on('error', (err) => {
      dialog.showErrorBox(`Error: ${app.name}`, err.message)
    })

    sp.on('close', (code) => {
      // console.log(`child process exited with code ${code}`)
      dispatch(removeSession(id))
      // TODO: Remove temp app
    })

    const handleStdout =
      (isError = false) =>
      (chunk: Buffer) => {
        const data = chunk.toString()
        // TODO: stderr colors
        dispatch(updateLog(id, data))
      }

    if (sp.stdout) {
      sp.stdout.on('data', handleStdout())
    }
    if (sp.stderr) {
      sp.stderr.on('data', handleStdout(true))
    }
  }

export const detectApps =
  (adapter: Adapter): ThunkAction<any, State, any, any> =>
  async (dispatch) => {
    dispatch(getAppStart())
    const apps = await adapter.readApps()
    const appInfo = {} as Dict<AppInfo>
    apps
      .filter((app): app is AppInfo => typeof app !== 'undefined')
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .forEach((app) => {
        appInfo[app.id] = app
      })
    dispatch(getApps(appInfo))
  }
