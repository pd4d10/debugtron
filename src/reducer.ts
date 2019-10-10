import { combineReducers, Reducer } from 'redux'
import { AppInfo, Dict, InstancePayload } from './types'

export const GET_APPS = 'GET_APPS'
export const ADD_INSTANCE = 'ADD_INSTANCE'
export const UPDATE_INSTANCE = 'UPDATE_INSTANCE'
export const UPDATE_LOG = 'UPDATE_LOG'
export const REMOVE_INSTANCE = 'REMOVE_INSTANCE'
const UPDATE_NODE_PORT = 'UPDATE_NODE_PORT'
const UPDATE_WINDOW_PORT = 'UPDATE_WINDOW_PORT'

export interface State {
  appInfo: Dict<AppInfo>
  instanceInfo: Dict<InstancePayload>
}

const appInfo: Reducer<Dict<AppInfo>> = (state = {}, action) => {
  switch (action.type) {
    case GET_APPS:
      return action.payload
    default:
      return state
  }
}

const instanceInfo: Reducer<Dict<InstancePayload>> = (state = {}, action) => {
  const { payload } = action

  switch (action.type) {
    case ADD_INSTANCE:
      return {
        ...state,
        [payload.instanceId]: {
          appId: payload.appId,
          pages: {},
          log: '',
        },
      }
    case UPDATE_INSTANCE: {
      const { instanceId, pages } = payload
      return {
        ...state,
        [instanceId]: {
          ...state[instanceId],
          pages,
        },
      }
    }
    case UPDATE_LOG: {
      const { instanceId } = payload
      return {
        ...state,
        [instanceId]: {
          ...state[instanceId],
          log: state[instanceId].log + payload.log,
        },
      }
    }
    case REMOVE_INSTANCE: {
      const copy = { ...state }
      delete copy[payload.instanceId]
      return copy
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

export const updateNodePort = (id: string, port: string) => ({
  type: UPDATE_NODE_PORT,
  payload: { id, port },
})

export const updateWindowPort = (id: string, port: string) => ({
  type: UPDATE_WINDOW_PORT,
  payload: { id, port },
})

export const reducer = combineReducers({ appInfo, instanceInfo })
