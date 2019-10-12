import { Reducer } from 'redux'
import { Dict, SessionInfo, PageInfo } from '../types'

const ADD_SESSION = 'ADD_SESSION'
const UPDATE_PAGES = 'UPDATE_PAGES'
const UPDATE_LOG = 'UPDATE_LOG'
const REMOVE_SESSION = 'REMOVE_SESSION'
const UPDATE_NODE_PORT = 'UPDATE_NODE_PORT'
const UPDATE_WINDOW_PORT = 'UPDATE_WINDOW_PORT'

export const sessionInfo: Reducer<Dict<SessionInfo>> = (state = {}, action) => {
  const { payload } = action

  switch (action.type) {
    case ADD_SESSION:
      return {
        ...state,
        [payload.id]: {
          appId: payload.appId,
          pages: {},
          log: '',
        },
      }
    case REMOVE_SESSION: {
      const copy = { ...state }
      delete copy[payload.id]
      return copy
    }
    case UPDATE_PAGES:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          pages: payload.pages,
        },
      }
    case UPDATE_LOG:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          log: state[payload.id].log + payload.log,
        },
      }
    case UPDATE_NODE_PORT:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          nodePort: payload.port,
        },
      }
    case UPDATE_WINDOW_PORT:
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          windowPort: payload.port,
        },
      }
    default:
      return state
  }
}

export const addSession = (id: string, appId: string) => ({
  type: ADD_SESSION,
  payload: { id, appId },
})

export const removeSession = (id: string) => ({
  type: REMOVE_SESSION,
  payload: { id },
})

export const updateLog = (id: string, log: string) => ({
  type: UPDATE_LOG,
  payload: { id, log },
})

export const updatePages = (id: string, pages: Dict<PageInfo>) => ({
  type: UPDATE_PAGES,
  payload: { id, pages },
})

export const updateNodePort = (id: string, port: string) => ({
  type: UPDATE_NODE_PORT,
  payload: { id, port },
})

export const updateWindowPort = (id: string, port: string) => ({
  type: UPDATE_WINDOW_PORT,
  payload: { id, port },
})
