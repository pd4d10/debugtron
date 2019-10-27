import { v4 } from 'uuid'
import fs from 'fs'
import { spawn } from 'child_process'
import { AppInfo } from '../types'
import { Store } from 'redux'
import {
  updateNodePort,
  updateWindowPort,
  addSession,
  updateLog,
  removeSession,
} from '../reducers/session'
import { State } from '../reducers'
import { dialog } from 'electron'

export async function readdirSafe(dir: string) {
  try {
    return fs.promises.readdir(dir)
  } catch (err) {
    return []
  }
}

export async function startDebugging(app: AppInfo, store: Store<State>) {
  const sp = spawn(app.exePath, [`--inspect=0`, `--remote-debugging-port=0`])

  const id = v4()
  store.dispatch(addSession(id, app.id))

  sp.on('error', err => {
    dialog.showErrorBox(`Error: ${app.name}`, err.message)
  })

  sp.on('close', code => {
    // console.log(`child process exited with code ${code}`)
    store.dispatch(removeSession(id))
    // TODO: Remove temp app
  })

  const handleStdout = (isError = false) => (chunk: Buffer) => {
    const data = chunk.toString()
    const session = store.getState().sessionInfo[id]

    // Try to find listening port from log
    if (!session.nodePort) {
      const match = /Debugger listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      if (match) {
        store.dispatch(updateNodePort(id, match[1]))
      }
    }
    if (!session.windowPort) {
      const match = /DevTools listening on ws:\/\/127.0.0.1:(\d+)\//.exec(data)
      if (match) {
        store.dispatch(updateWindowPort(id, match[1]))
      }
    }

    // TODO: stderr colors
    store.dispatch(updateLog(id, data))
  }

  if (sp.stdout) {
    sp.stdout.on('data', handleStdout())
  }
  if (sp.stderr) {
    sp.stderr.on('data', handleStdout(true))
  }
}
