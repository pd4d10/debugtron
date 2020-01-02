import { v4 } from 'uuid'
import { spawn } from 'child_process'
import { updatePages } from '../reducers/session'
import { PageInfo, Dict, AppInfo } from '../types'
import fetch from 'node-fetch'
import {
  updateNodePort,
  updateWindowPort,
  addSession,
  updateLog,
  removeSession,
} from '../reducers/session'
import { State } from '../reducers'
import { dialog } from 'electron'
import { ThunkAction } from 'redux-thunk'

export const fetchPages = (): ThunkAction<any, State, any, any> => async (
  dispatch,
  getState,
) => {
  const { sessionInfo } = getState()
  for (let [id, info] of Object.entries(sessionInfo)) {
    const ports: string[] = []
    if (info.nodePort) ports.push(info.nodePort)
    if (info.windowPort) ports.push(info.windowPort)

    const payloads = await Promise.all(
      ports.map(port =>
        fetch(`http://127.0.0.1:${port}/json`).then(res => res.json()),
      ),
    )

    const pages = payloads.flat() as PageInfo[]
    if (pages.length === 0) return

    const pageDict = pages
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .reduce((a, b) => {
        a[b.id] = b
        return a
      }, {} as Dict<PageInfo>)

    dispatch(updatePages(id, pageDict))
  }
}

export const startDebugging = (
  app: AppInfo,
): ThunkAction<any, State, any, any> => (dispatch, getState) => {
  const sp = spawn(app.exePath, [`--inspect=0`, `--remote-debugging-port=0`])

  const id = v4()
  dispatch(addSession(id, app.id))

  sp.on('error', err => {
    dialog.showErrorBox(`Error: ${app.name}`, err.message)
  })

  sp.on('close', code => {
    // console.log(`child process exited with code ${code}`)
    dispatch(removeSession(id))
    // TODO: Remove temp app
  })

  const handleStdout = (isError = false) => (chunk: Buffer) => {
    const data = chunk.toString()
    const session = getState().sessionInfo[id]

    // Try to find listening port from log
    if (!session.nodePort) {
      const match = /Debugger listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      if (match) {
        dispatch(updateNodePort(id, match[1]))
      }
    }
    if (!session.windowPort) {
      const match = /DevTools listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      if (match) {
        dispatch(updateWindowPort(id, match[1]))
      }
    }

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
