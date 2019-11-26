import { Reducer } from 'redux'
import { AppInfo, Dict } from '../types'

const GET_APPS = 'GET_APPS'
const ADD_TEMP_APP = 'ADD_TEMP_APP'
const APP_LOAD_START = 'APP_LOAD_START'

export const appInfo: Reducer<Dict<AppInfo>> = (state = {}, action) => {
  const { payload } = action
  switch (action.type) {
    case GET_APPS:
      return payload
    case ADD_TEMP_APP:
      if (state[payload.id]) return state
      return {
        ...state,
        [payload.id]: {
          ...payload,
          hidden: true,
        },
      }
    default:
      return state
  }
}

export const appLoading: Reducer<boolean> = (state = false, action) => {
  switch (action.type) {
    case APP_LOAD_START:
      return true
    case GET_APPS:
      return false
    default:
      return state
  }
}

export const getAppStart = () => ({ type: APP_LOAD_START })

export const getApps = (apps: Dict<AppInfo>) => ({
  type: GET_APPS,
  payload: apps,
})

export const addTempApp = (app: AppInfo) => ({
  type: ADD_TEMP_APP,
  payload: app,
})
