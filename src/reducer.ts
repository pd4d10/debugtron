import { combineReducers, Reducer } from 'redux'
import { AppInfo, Dict, InstancePayload } from './types'

export const GET_APPS = 'GET_APPS'
export const ADD_INSTANCE = 'ADD_INSTANCE'
export const UPDATE_INSTANCE = 'UPDATE_INSTANCE'
export const UPDATE_LOG = 'UPDATE_LOG'
export const REMOVE_INSTANCE = 'REMOVE_INSTANCE'

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
  switch (action.type) {
    case ADD_INSTANCE:
      return {
        ...state,
        [action.payload.instanceId]: {
          appId: action.payload.appId,
          pages: {},
          log: '',
        },
      }
    case UPDATE_INSTANCE: {
      const { instanceId } = action.payload
      return {
        ...state,
        [instanceId]: {
          ...state[instanceId],
          pages: {
            ...state[instanceId].pages,
            ...action.payload.pages,
          },
        },
      }
    }
    case UPDATE_LOG: {
      const { instanceId } = action.payload
      return {
        ...state,
        [instanceId]: {
          ...state[instanceId],
          log: state[instanceId].log + action.payload.log,
        },
      }
    }
    case REMOVE_INSTANCE: {
      const copy = { ...state }
      delete copy[action.payload.instanceId]
      return copy
    }
    default:
      return state
  }
}

export const reducer = combineReducers({ appInfo, instanceInfo })
